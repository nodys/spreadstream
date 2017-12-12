const google = require('googleapis')
const GoogleAuth = require('google-auth-library')
const { fromCallback } = require('bluebird')

module.exports = run

async function run (data, config) {
  const googleAuth = new GoogleAuth()
  const spreadsheetId = config.id
  const sheetTitle = config.sheet
  const sheets = google.sheets('v4')
  const auth = (await fromCallback(cb => googleAuth.fromJSON(config.credential, cb)))
    .createScoped(['https://www.googleapis.com/auth/spreadsheets'])

  // Read some stats from data:
  const rowCount = data.length
  const columnCount = data.reduce((memo, row) => Math.max(memo, row.length), 0)

  // Should we replace the previous values with new one ?
  let replace = config.replace

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
    let addSheet = await fromCallback(cb => sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetTitle,
                gridProperties: {
                  rowCount,
                  columnCount
                }
              }
            }
          }
        ]
      }
    }, cb))
    sheet = addSheet.replies[0].addSheet
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

run.toColumnName = function (num) {
  for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
    ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret
  }
  return ret
}

// run().catch(e => console.error(e.stack))
//
// async function collectObjectStream (stream) {
//   return new Promise((resolve) => {
//     let store = []
//     stream.pipe(Transform({
//       objectMode: true,
//       transform (chunk, enc, cb) {
//         store.push(chunk)
//         cb()
//       },
//       flush (cb) {
//         resolve(store)
//         cb()
//       }
//     }))
//   })
// }
