module.exports = makeMock

function makeMock () {
  const mocked = {
    get: [],
    batchUpdate: [],
    values: {
      clear: [],
      append: []
    }
  }
  const mock = {
    mocked,
    spreadsheets: {
      get (query, cb) {
        const { spreadsheetId } = query
        mocked.get.push(query)
        cb(null, {
          spreadsheetId,
          sheets: [ makeMock.makeSheet() ]
        })
      },

      batchUpdate (query, cb) {
        mocked.batchUpdate.push(query)
        cb(null, { replies: query.resource.requests.map(q => {
          const key = Object.keys(q)[0]
          const param = q[key]
          return param
        })})
      },

      values: {
        clear: (data, cb) => {
          mocked.values.clear.push(data)
          cb()
        },
        append: (data, cb) => {
          mocked.values.append.push(data)
          cb()
        }
      }
    }
  }
  return mock
}

makeMock.makeSheet = ({ title = 'test', rowCount = 2, columnCount = 2 } = {}) => {
  return { properties: { title: 'test', gridProperties: { rowCount, columnCount } } }
}