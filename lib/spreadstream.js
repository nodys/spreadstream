const google = require('googleapis')
const GoogleAuth = require('google-auth-library')
const { fromCallback } = require('bluebird')
const miss = require('mississippi')
const chalk = require('chalk')

const sheets = google.sheets('v4')

const noop = _ => _

module.exports = spreadstream

/**
 *
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

  // Verbose logger utility
  const log = config.verbose ? verbose : noop

  // Total row counter
  let total = 0

  // Stream buffer
  let buffer = []

  // Google spreadsheet initialized document
  let doc

  async function flush () {
    if (!buffer.length) return
    let values = []
    if (!doc) {
      log(`Load document and sheet`)
      doc = await loadDocument(config)
    }

    if (doc.addHeaders && flush.count === 0) {
      log('Add headers')
      values.push(Object.keys(buffer[0]))
    }

    for (let row of buffer) {
      values.push(Object.values(row))
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

// The values will be parsed as if the user typed them into the UI (the default)
spreadstream.USER_ENTERED = 'USER_ENTERED'

// The values will be stored as-is
spreadstream.RAW = 'RAW'

/**
 * Load spreadsheet document
 * @param  {Object} config  Configuration
 * @param  {String} config.id  spreadsheet id
 * @param  {String} config.sheet  spreadsheet sheet name
 * @param  {Boolean} [config.replace] Replace current sheet value (default: false, append)
 * @return {Promise}
 * @see https://developers.google.com/sheets/api/guides/concepts
 */
async function loadDocument (config) {
  const googleAuth = new GoogleAuth()
  const spreadsheetId = config.id
  const sheetTitle = config.sheet
  const valueInputOption = config.valueInputOption || spreadstream.USER_ENTERED
  const auth = (await fromCallback(cb => googleAuth.fromJSON(config.credential, cb)))
    .createScoped(['https://www.googleapis.com/auth/spreadsheets'])

  // Should we replace the previous values with new one ?
  let replace = Boolean(config.replace)

  // Should we keep header line
  let addHeaders = replace

  // Load spreadsheet document
  let spreadsheet = await fromCallback(cb => sheets.spreadsheets.get({
    auth,
    spreadsheetId,
    ranges: []
  }, cb))

  // Load the sheet (from title)
  let sheet = spreadsheet.sheets.find(s => s.properties.title === sheetTitle)

  // If the sheet does not exists let create one
  if (!sheet) {
    addHeaders = true
    sheet = await createSheet(sheetTitle, spreadsheet, auth)
  }

  // Clear current sheet
  if (replace) {
    let range = `A1:${toColumnName(sheet.properties.gridProperties.columnCount)}${sheet.properties.gridProperties.rowCount}`
    await fromCallback(cb => sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId,
      range: `'${sheetTitle}'!${range}`,
      resource: {}
    }, cb))
  }

  // Push data to document (append)
  async function push (values) {
    return fromCallback(cb => sheets.spreadsheets.values.append({
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
 * Create a new sheet in the given spreadsheet
 * @param  {String} title       Sheet title
 * @param  {Object} spreadsheet spreadsheet instance
 * @param  {Object} auth        Google Auth instance
 * @return {Promise<Object>}    Google spreadsheet instance
 */
async function createSheet (title, spreadsheet, auth) {
  let addSheet = await fromCallback(cb => sheets.spreadsheets.batchUpdate({
    auth,
    spreadsheetId: spreadsheet.spreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: title,
              gridProperties: {
                rowCount: 1,
                columnCount: 1
              }
            }
          }
        }
      ]
    }
  }, cb))
  return addSheet.replies[0].addSheet
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

/**
 * Verbose helper
 * @param  {[type]} message [description]
 * @return {[type]}         [description]
 */
function verbose (message) {
  console.log(chalk`[{green ${(new Date()).toISOString()}}] ${message}`)
}
