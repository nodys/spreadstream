const google = require('googleapis')
const GoogleAuth = require('google-auth-library')
const { fromCallback } = require('bluebird')

const sheets = google.sheets('v4')

module.exports = run

/**
 * Run spreadsheet feeder
 * @param  {Array[]} data   Array of row (including header)
 * @param  {Object} config  Configuration
 * @param  {String} config.id  spreadsheet id
 * @param  {String} config.sheet  spreadsheet sheet name
 * @param  {Boolean} [config.replace] Replace current sheet value (default: false, append)
 * @return {Promise}
 * @see https://developers.google.com/sheets/api/guides/concepts
 */
async function run (data, config) {
  const googleAuth = new GoogleAuth()
  const spreadsheetId = config.id
  const sheetTitle = config.sheet
  const auth = (await fromCallback(cb => googleAuth.fromJSON(config.credential, cb)))
    .createScoped(['https://www.googleapis.com/auth/spreadsheets'])

  // Should we replace the previous values with new one ?
  let replace = Boolean(config.replace)

  // Should we keep header line
  let headers = replace

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
    headers = true
    sheet = await createSheet(sheetTitle, spreadsheet, auth)
  }

  // Clear current sheet
  if (replace) {
    let range = `A1:${run.toColumnName(sheet.properties.gridProperties.columnCount)}${sheet.properties.gridProperties.rowCount}`
    await fromCallback(cb => sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId,
      range: `'${sheetTitle}'!${range}`,
      resource: {}
    }, cb))
  }

  // Append values
  await fromCallback(cb => sheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: `'${sheetTitle}'!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: headers ? data.slice() : data.slice(1)
    }
  }, cb))
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
 */
run.toColumnName = function (num) {
  for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret
  }
  return ret
}
