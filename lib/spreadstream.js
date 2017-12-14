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
 * @param  {String} [config.valueInputOption] See google sheet api for input option
 * @param  {String} [config.verbose] Be verbose about progression
 * @return {Writeable} Writeable object stream
 * @see https://developers.google.com/sheets/api/guides/concepts
 */
function spreadstream (config) {
  // Check required configs
  if (!config.id) throw new Error('Missing requird config: spreadsheet id')
  if (!config.sheet) throw new Error('Missing requird config: sheet title')

  // Verbose logger utility (or noop)
  const log = config.verbose
    ? m => console.error(chalk`[{green ${(new Date()).toISOString()}}] ${m}`)
    : m => m

  // Total row counter
  let total = 0

  // Stream buffer
  let buffer = []

  // Google spreadsheet initialized document
  let doc

  // Headers
  let headers = config.headers

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
      if (!headers) {
        if (streamType === enums.streamType.ARRAY) {
          headers = [...firstRow]
          buffer.shift()
        } else {
          headers = Object.keys(firstRow)
        }
      }

      // Add headers (first flush and we are not in append mode)
      if (doc.addHeaders) {
        log('Add headers')
        values.push(headers)
      }
    }

    // Push rows
    for (let row of buffer) {
      if (streamType === enums.streamType.OBJECT) {
        // Objects values following headers order
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

  return miss.through.obj(function (row, _, done) {
    buffer.push(row)
    if (buffer.length > config.maxBuffer) {
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
  const spreadsheetId = config.id
  const sheetTitle = config.sheet
  const valueInputOption = config.valueInputOption || enums.valueInput.USER_ENTERED
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
  let sheet = spreadsheet.sheets.find(s => s.properties.title === sheetTitle)

  // If the sheet does not exists let create one
  if (!sheet) {
    addHeaders = true
    let addSheet = await fromCallback(cb => sheetsApi.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: spreadsheet.spreadsheetId,
      resource: {
        requests: [{
          addSheet: {
            properties: { title: sheetTitle, gridProperties: { rowCount: 1, columnCount: 1 } }
          }
        }]
      }
    }, cb))
    sheet = addSheet.replies[0].addSheet
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
 * @return {Array} Results
 */
spreadstream.readDocument = async function (config) {
  const spreadsheetId = config.id
  const sheetTitle = config.sheet
  const auth = await spreadstream.google.authenticate(config.credential)
  const sheetsApi = spreadstream.google.sheets
  const valueRenderOption = config.valueRender || enums.valueRender.FORMATTED_VALUE
  const dateTimeRenderOption = config.dateTimeRender || enums.dateTimeRender.SERIAL_NUMBER

  // Load spreadsheet document
  let spreadsheet = await fromCallback(cb => sheetsApi.spreadsheets.get({
    auth,
    spreadsheetId,
    ranges: []
  }, cb))

  // Load the sheet (from title)
  let sheet = spreadsheet.sheets.find(s => s.properties.title === sheetTitle)

  if (!sheet) {
    return []
  }

  const params = {
    auth,
    spreadsheetId,
    dateTimeRenderOption,
    valueRenderOption,
    range: `'${sheetTitle}'!A1:${toColumnName(sheet.properties.gridProperties.columnCount)}${sheet.properties.gridProperties.rowCount}`
  }

  const response = await fromCallback(cb => sheetsApi.spreadsheets.values.get(params, cb))
  return response.values
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
