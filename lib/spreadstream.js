const { fromCallback } = require('bluebird')
const miss = require('mississippi')
const chalk = require('chalk')
const enums = require('./enums')
const google = require('./google-wrapper')

module.exports = spreadstream

/**
 * Create spreadstream writable stream
 * @param  {Object} config  Configuration
 * @param  {String} config.id  spreadsheet id
 * @param  {String} config.sheet  spreadsheet sheet name
 * @param  {Boolean} [config.replace] Replace current sheet value (default: false, append)
 * @param  {Number} [config.maxBuffer] Max stream buffer size before flushing to document
 * @param  {String} [config.valueInput] See google sheet api for input option
 * @param  {String} [config.verbose] Be verbose about progression
 * @param  {Boolean} [config.noheaders=false] Force config.writeHeaders and config.writeHeaders to false
 * @param  {Boolean} [config.writeHeaders=true] Write headers (default: true)
 * @param  {Boolean} [config.readHeaders=true] Read headers from first source chunk (default: true)
 * @return {Writeable} Writeable object stream
 * @see https://developers.google.com/sheets/api/guides/concepts
 */
function spreadstream (config) {
  config = spreadstream._normalizeConfig(config)

  // Check required configs
  if (!config.id) throw new Error('Missing required config: spreadsheet id')
  if (!config.sheet) throw new Error('Missing required config: sheet title')

  // Verbose logger utility (or noop)
  const log = config.verbose /* istanbul ignore next */
    ? m => console.error(chalk`[{green ${(new Date()).toISOString()}}] ${m}`)
    : m => m

  // Total row counter
  let total = 0

  // Stream buffer
  let buffer = []

  // Google spreadsheet initialized document
  let doc

  // Headers
  let headers

  // Type of stream (Array or Object)
  let streamType

  async function flush () {
    if (!buffer.length) return

    let values = []

    if (!doc) {
      log(`Load document and sheet`)
      doc = await spreadstream.writableDocument(config)
    }

    // If first flush...
    if (flush.count === 0) {
      // Remove first line (headers)
      let firstRow = buffer[0]

      // Store type of stream
      streamType = Array.isArray(firstRow) ? enums.streamType.ARRAY : enums.streamType.OBJECT

      // Store headers
      if (config.readHeaders) {
        if (streamType === enums.streamType.ARRAY) {
          headers = [...firstRow]
          buffer.shift()
        } else {
          headers = Object.keys(firstRow)
        }
      } else {
        if (streamType === enums.streamType.ARRAY) {
          headers = Array(firstRow.length).fill(0).map((_, index) => toColumnName(index + 1))
        } else {
          // readHeaders has no effect on object stream
          headers = Object.keys(firstRow)
        }
      }

      // Add headers (first flush, with write header on and we are not in append mode)
      if (doc.addHeaders && config.writeHeaders) {
        log('Add headers')
        values.push(headers)
      }
    }

    // Push rows
    for (let row of buffer) {
      if (streamType === enums.streamType.OBJECT) {
        values.push(headers.map(key => row[key]))
      } else {
        values.push(row)
      }
    }

    total += values.length

    log(`Flush ${values.length} rows`)
    await doc.push(values)

    buffer = []
    flush.count++
  }

  // Count flush calls (and trac first flush to add headers)
  flush.count = 0

  return miss.to.obj(function (row, _, done) {
    buffer.push(row)
    if (buffer.length >= config.maxBuffer) {
      flush().then(() => done(), done)
    } else {
      done()
    }
  }, async function (done) {
    try {
      await flush()
      log(`Success (${total} rows inserted)`)
      done()
    } catch (error) {
      done(error)
    }
  })
}

// Expose api
spreadstream.google = google
spreadstream.enums = enums

/**
 * Retrurn proper config --
 * @param  {object} _config
 * @return {object}
 */
spreadstream._normalizeConfig = function (_config) {
  const config = {
    writeHeaders: true,
    readHeaders: true,
    ..._config
  }

  if (config.noheaders === true) {
    config.writeHeaders = false
    config.readHeaders = false
  }

  return config
}

/**
 * Load spreadsheet document (for writing)
 * @param  {Object} config  Configuration
 * @param  {String} config.id  spreadsheet id
 * @param  {String} config.sheet  spreadsheet sheet name
 * @param  {Boolean} [config.replace] Replace current sheet value (default: false, append)
 * @return {Promise} Returns an object with
 *   - {function} push({Array[] value) - Push values
 *   - {boolean} addHeaders - Headers row expected in first push (replace is true or sheet is new)
 *   - {object} spreadsheet - Spreadsheet instance
 *   - {object} sheet - Sheet instance
 *
 * @see https://developers.google.com/sheets/api/guides/concepts
 */
spreadstream.writableDocument = async function (config) {
  config = spreadstream._normalizeConfig(config)

  // Check config
  if (!config.id) throw new Error('Missing required config: spreadsheet id')
  if (!config.sheet) throw new Error('Missing required config: sheet title')

  const spreadsheetId = config.id
  const sheetTitle = config.sheet
  const valueInputOption = config.valueInput || enums.valueInput.USER_ENTERED
  const auth = await spreadstream.google.authenticate(config.credential)
  const sheetsApi = spreadstream.google.sheets

  // Should we replace the previous values with new one ?
  let replace = Boolean(config.replace)

  // Should we keep header line
  let addHeaders = replace

  // Load spreadsheet document
  let spreadsheet = await fromCallback(cb => sheetsApi.spreadsheets.get({
    auth,
    spreadsheetId,
    ranges: []
  }, cb))

  // Load the sheet (from title)
  let sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetTitle)
  // If the sheet does not exists let create one
  if (!sheet) {
    addHeaders = true
    let addSheet = await fromCallback(cb => sheetsApi.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: spreadsheet.data.spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: { title: sheetTitle, gridProperties: { rowCount: 1, columnCount: 1 } }
          }
        }]
      }
    }, cb))
    sheet = addSheet.data.replies[0].addSheet
  }

  // Clear current sheet
  if (replace) {
    let range = `A1:${toColumnName(sheet.properties.gridProperties.columnCount)}${sheet.properties.gridProperties.rowCount}`
    await fromCallback(cb => sheetsApi.spreadsheets.values.clear({
      auth,
      spreadsheetId,
      range: `'${sheetTitle}'!${range}`,
      resource: {}
    }, cb))
  }

  // Push data to document (append)
  async function push (values) {
    return fromCallback(cb => sheetsApi.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: `'${sheetTitle}'!A1`,
      valueInputOption,
      resource: { values }
    }, cb))
  }

  return {
    addHeaders,
    spreadsheet,
    sheet,
    push
  }
}

/**
 * Read document
 * @param  {Object} config configuration
 * @param  {String} config.id  spreadsheet id
 * @param  {String} config.sheet  spreadsheet sheet name
 * @param  {Boolean} [config.readHeaders=true] Read headers from first source chunk (default: true)
 * @return {Array} Results
 */
spreadstream.readDocument = async function (config) {
  config = spreadstream._normalizeConfig(config)

  // Check required configs
  if (!config.id) throw new Error('Missing required config: spreadsheet id')
  if (!config.sheet) throw new Error('Missing required config: sheet title')

  const spreadsheetId = config.id
  const sheetTitle = config.sheet
  const auth = await spreadstream.google.authenticate(config.credential)
  const sheetsApi = spreadstream.google.sheets
  const valueRenderOption = config.valueRender || enums.valueRender.FORMATTED_VALUE
  const dateTimeRenderOption = config.dateTimeRender || enums.dateTimeRender.SERIAL_NUMBER
  const majorDimension = config.majorDimension

  // Verbose logger utility (or noop)
  const log = config.verbose /* istanbul ignore next */
    ? m => console.error(chalk`[{green ${(new Date()).toISOString()}}] ${m}`)
    : m => m

  let range = config.range
    ? `'${sheetTitle}'!${config.range}`
    : `'${sheetTitle}'`

  const params = {
    auth,
    spreadsheetId,
    dateTimeRenderOption,
    valueRenderOption,
    majorDimension,
    range
  }

  // Permissive reading (ignore errors)
  try {
    const response = await fromCallback(cb => sheetsApi.spreadsheets.values.get(params, cb))
    const values = [...response.data.values]
    if (!config.readHeaders) {
      // Add generated headers:
      values.unshift(Array(values[0].length).fill(0).map((_, index) => toColumnName(index + 1)))
    }
    return values
  } catch (ignore) {
    log(`Sheet is unreadable. The document or the sheet may not exists yet. Original message: "${ignore.message}"`)
    return []
  }
}

/**
 * Generate a column name from column index
 * @param  {Number} num
 * @return {String} Column name (AB)
 * @author http://cwestblog.com/2013/09/05/javascript-snippet-convert-number-to-column-name/
 */
function toColumnName (num) {
  for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret
  }
  return ret
}
