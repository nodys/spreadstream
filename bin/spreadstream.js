#!/usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const rc = require('rc')
const fs = require('fs')
const spreadsheet = require('../lib/spreadstream')
const miss = require('mississippi')
const csv = require('csv-parser')

const APPNAME = path.basename(__filename, path.extname(__filename))
const config = rc(APPNAME, {})
const argv = yargs
  .usage(`${APPNAME} [options] [input csv file]`)
  .config(config)
  .option('credential', {
    description: 'Google service account credential config file',
    type: 'string',
    coerce: function (credential) {
      try {
        return JSON.parse(fs.readFileSync(credential, 'utf-8'))
      } catch (ignore) { return credential }
    }
  })
  .option('id', {
    type: 'string',
    required: true,
    alias: 'i',
    description: 'Identifier of the spreadsheet document'
  })
  .option('sheet', {
    type: 'string',
    required: true,
    alias: 's',
    description: 'Name of the sheet'
  })
  .option('replace', {
    type: 'boolean',
    description: 'Append data instead of replace data in the sheet'
  })
  .epilogue(fs.readFileSync(path.resolve(__dirname, './epilogue.txt'), 'utf-8'))
  .parse()

if (!argv.credential || (argv.credential.type !== 'service_account')) {
  console.error('Missing google service account credential. Provide by option or rc file. See --help for more informations.')
  process.exit(1)
}

// Select stream
let stream = process.stdin

if (argv._.length) {
  stream = fs.createReadStream(argv._[0])
} else if (process.isTTY) {
  console.error('Missing input (csv file path or standard input)')
  process.exit(1)
}

// Collect data
let data = []
stream
  .pipe(csv())
  .pipe(miss.through.obj((row, _, done) => {
    // Add headers
    if (!data.length) { data.push(Object.keys(row)) }
    data.push(Object.values(row))
    done()
  }))
  .on('finish', async () => {
    try {
      await spreadsheet(data, argv)
    } catch (error) {
      console.error('Oups: Something wrong happened "%s"', error.message)
      process.exit(1)
    }
  })
