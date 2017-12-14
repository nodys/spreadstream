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
    it('should break on missing config', () => {
      expect(() => spreadstream()).to.throw('Cannot read property')
    })

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
  })
})
