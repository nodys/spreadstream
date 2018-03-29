/* eslint-env mocha */
/* eslint-disable no-unused-expressions */ /* for chai */

// Tip: Hey, u need a konami code to switch to level 3 ? try `npx mocha --inspect-brk`

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const miss = require('mississippi')
const { fromCallback } = require('bluebird')

// Chai promise support
chai.use(chaiAsPromised)

const { expect } = chai // eslint-disable-line no-unused-vars

const spreadstream = require('..')
const makeMock = require('./utils/mock-google-sheets.js')

/**
 * Stream form string
 */
function fromString (string) {
  return miss.from(function (size, next) {
    if (string.length <= 0) return next(null, null)
    var chunk = string.slice(0, size)
    string = string.slice(size)
    next(null, chunk)
  })
}

describe('spreadstream', function () {
  let mocked
  let defconf = {
    credential: {},
    id: 'xxx',
    sheet: 'test'
  }

  beforeEach(() => {
    spreadstream.google.sheets = makeMock()
    mocked = spreadstream.google.sheets.mocked
    spreadstream.google.authenticate = async () => ({})
  })

  describe('spreadstream()', function () {
    it('should break on missing document id', () => {
      expect(() => spreadstream({})).to.throw('Missing required config: spreadsheet id')
    })

    it('should break on missing sheet title', () => {
      expect(() => spreadstream({ id: 'xxx' })).to.throw('Missing required config: sheet title')
    })

    it('should support empty feed', async () => {
      const stream = spreadstream({ ...defconf })
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
    })

    it('should create a writable stream reading object (replace)', async () => {
      const stream = spreadstream({ ...defconf, replace: true })
      stream.write({ foo: 24, bar: 42 })
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
      expect(mocked.get[0]).to.eql({ auth: {}, spreadsheetId: 'xxx', ranges: [] })
      expect(mocked.values.append[0].resource.values).to.eql([ [ 'foo', 'bar' ], [ 24, 42 ] ])
      expect(mocked.values.clear[0]).to.eql({
        auth: {},
        spreadsheetId: 'xxx',
        range: `'test'!A1:B2`,
        resource: {}
      })
    })

    it('should create a writable stream reading array (replace)', async () => {
      const stream = spreadstream({ ...defconf, replace: true })
      stream.write(['foo', 'bar'])
      stream.write([24, 42])
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
      expect(mocked.values.append[0].resource.values).to.eql([ [ 'foo', 'bar' ], [ 24, 42 ] ])
    })

    it('should create a writable stream reading object (append)', async () => {
      const stream = spreadstream({ ...defconf })
      stream.write({ foo: 24, bar: 42 })
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
      expect(mocked.values.append[0].resource.values).to.eql([ [ 24, 42 ] ])
      expect(mocked.values.clear).to.be.eql([])
    })

    it('should create a writable stream reading array (append)', async () => {
      const stream = spreadstream({ ...defconf })
      stream.write(['foo', 'bar'])
      stream.write([24, 42])
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
      expect(mocked.values.append[0].resource.values).to.eql([ [ 24, 42 ] ])
      expect(mocked.values.clear).to.be.eql([])
    })

    it.skip('should limit data according to header list (only with object stream) (removed in v2)', async () => {
      const stream = spreadstream({ ...defconf, headers: ['bar'] })
      stream.write({ foo: 24, bar: 42 })
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
      expect(mocked.values.append[0].resource.values).to.eql([ [ 42 ] ])
      expect(mocked.values.clear).to.be.eql([])
    })

    it('should flush many times (according to maxBuffer)', async () => {
      const stream = spreadstream({ ...defconf, maxBuffer: 1 })
      stream.write(['foo', 'bar'])
      stream.write([1, 42])
      stream.write([2, 42])
      stream.write([3, 42])
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
      expect(mocked.values.append).to.have.length(4) // First flush is the header
    })

    it('should handle properly write errors', async () => {
      const stream = spreadstream({ ...defconf })
      spreadstream.google.sheets.spreadsheets.values
        .append = (_, done) => { done(new Error('Network error')) }
      stream.write(['foo', 'bar'])
      stream.write([24, 42])
      stream.end()
      await expect(fromCallback(cb => miss.finished(stream, cb)))
        .to.eventually.be.rejected
    })

    it('should create the sheet if the sheet does not exists', async () => {
      const stream = spreadstream({ ...defconf })
      spreadstream.google.sheets.spreadsheets.get = ({ spreadsheetId }, done) => {
        done(null, {
          data: {
            spreadsheetId,
            sheets: [ ]
          }
        })
      }
      stream.write(['foo', 'bar'])
      stream.write([24, 42])
      stream.end()
      await fromCallback(cb => miss.finished(stream, cb))
      expect(mocked.values.append[0].resource.values).to.eql([ [ 'foo', 'bar' ], [ 24, 42 ] ])
      expect(mocked.batchUpdate[0].resource.requests[0]).to.eql(
        { addSheet: {
          properties: { title: 'test', gridProperties: { rowCount: 1, columnCount: 1 } }
        }}, 'should add header if the sheet does not exists (and replace is false)')
    })

    describe('Option readHeaders and writeHeaders', function () {
      it('readHeaders === false the first line in the input source is not treated as headers, and generic headers are generated', async () => {
        const stream = spreadstream({ ...defconf, readHeaders: false })
        spreadstream.google.sheets.spreadsheets.get = ({ spreadsheetId }, done) => {
          done(null, {
            data: {
              spreadsheetId,
              sheets: [ ]
            }
          })
        }
        stream.write([1, 2])
        stream.end()
        await fromCallback(cb => miss.finished(stream, cb))
        expect(mocked.values.append[0].resource.values).to.eql([ [ 'A', 'B' ], [ 1, 2 ] ])
      })
      it('readHeaders === false + writeHeaders === false', async () => {
        const stream = spreadstream({ ...defconf, readHeaders: false, writeHeaders: false })
        spreadstream.google.sheets.spreadsheets.get = ({ spreadsheetId }, done) => {
          done(null, {
            data: {
              spreadsheetId,
              sheets: [ ]
            }
          })
        }
        stream.write(['foo', 'bar'])
        stream.write([24, 42])
        stream.end()
        await fromCallback(cb => miss.finished(stream, cb))
        expect(mocked.values.append[0].resource.values).to.eql([ [ 'foo', 'bar' ], [ 24, 42 ] ])
      })

      it('readHeaders === false with object stream', async () => {
        const stream = spreadstream({ ...defconf, readHeaders: false })
        spreadstream.google.sheets.spreadsheets.get = ({ spreadsheetId }, done) => {
          done(null, {
            data: {
              spreadsheetId,
              sheets: [ ]
            }
          })
        }
        stream.write({ foo: 24, bar: 42 })
        stream.end()
        await fromCallback(cb => miss.finished(stream, cb))
        expect(mocked.values.append[0].resource.values).to.eql([ [ 'foo', 'bar' ], [ 24, 42 ] ])
      })

      it('options noheaders === false is an alias for readHeaders=writeHeaders=false', async () => {
        let config = spreadstream._normalizeConfig({ noheaders: true })
        expect(config).to.have.property('writeHeaders', false)
        expect(config).to.have.property('readHeaders', false)
      })
    })
  })

  describe('spreadstream.readDocument()', function () {
    it('should return a sheet content (full)', async () => {
      let result = await spreadstream.readDocument({ ...defconf })
      expect(mocked.values.get).to.have.length(1)
      expect(result).to.eql([ [ 'foo', 'bar' ], [ 24, -0.01 ], [ true, false ] ])
    })

    it('should return a sheet content (range)', async () => {
      let result = await spreadstream.readDocument({ ...defconf, range: 'A1:B2' })
      expect(mocked.values.get).to.have.length(1)
      expect(mocked.values.get[0].range).to.eql(`'test'!A1:B2`)
      expect(result).to.eql([ [ 'foo', 'bar' ], [ 24, -0.01 ], [ true, false ] ])
    })

    it('should loosly support unreadable sheet when the graceful is on (returning empty set)', async () => {
      spreadstream.google.sheets.spreadsheets.values
        .get = (_, done) => done(new Error('Not found'))
      let result = await spreadstream.readDocument({ ...defconf, graceful: true, range: 'A1:B2' })
      expect(result).to.eql([ ])
    })

    describe('Option readHeaders and writeHeaders', function () {
      it('readHeaders === false the first line in the sheet is not treated as headers, and generic headers are generated', async () => {
        let result = await spreadstream.readDocument({ ...defconf, readHeaders: false })
        expect(mocked.values.get).to.have.length(1)
        expect(result).to.eql([ ['A', 'B'], [ 'foo', 'bar' ], [ 24, -0.01 ], [ true, false ] ])
      })
    })
  })

  describe('spreadstream.streams', function () {
    describe('classicJsonInputStream()', function () {
      it('should parse classic json array input stream', async function () {
        const stream = spreadstream.streams.classicJsonInputStream()
        const result = await fromCallback(cb => fromString(`[{"foo": "bar", "bool": true}, { "bar": "foo", "bool": false } ]`)
          .pipe(stream)
          .pipe(miss.concat((result) => cb(null, result))))
        expect(result).to.eql([ { foo: 'bar', bool: true }, { bar: 'foo', bool: false } ])
      })

      it('should throw error if the source is invalid json', async function () {
        let promise = fromCallback(cb => miss.pipe(
          fromString(`[{invalid: json}]`),
          spreadstream.streams.classicJsonInputStream(), cb))
        await expect(promise).to.be.rejectedWith('unable to parse')
      })

      it('should throw error if the source is not an array', async function () {
        let promise = fromCallback(cb => miss.pipe(
          fromString(`{"foo": "bar"}`),
          spreadstream.streams.classicJsonInputStream(), cb))
        await expect(promise).to.be.rejectedWith('array expected')
      })
    })

    describe('classicJsonOutputStream()', function () {
      it('should produce classic json array output stream', async function () {
        const stream = spreadstream.streams.classicJsonOutputStream()
        const result = await fromCallback(cb => miss.from.obj([ { foo: 'bar', bool: true }, { bar: 'foo', bool: false } ])
          .pipe(stream)
          .pipe(miss.concat((result) => cb(null, result))))
        expect(result.trim()).to.eql(JSON.stringify([ { foo: 'bar', bool: true }, { bar: 'foo', bool: false } ], null, 2).trim())
      })

      it('should handle properly empty stream', async function () {
        const stream = spreadstream.streams.classicJsonOutputStream()
        const result = await fromCallback(cb => miss.from.obj([ ])
          .pipe(stream)
          .pipe(miss.concat((result) => cb(null, result))))
        expect(result.trim()).to.eql('[]')
      })
    })
  })
})
