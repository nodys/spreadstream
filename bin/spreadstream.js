#!/usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const rc = require('rc')
const fs = require('fs')
const spreadstream = require('../lib/spreadstream')
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
        return JSON.parse(fs.readFileSync(credential, 'utf-8')).creadential
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
    description: 'Replace data in the sheet (clear all values in the sheet)'
  })
  .option('verbose', {
    type: 'boolean',
    default: false,
    description: 'Print some informations'
  })
  .option('value-input-option', {
    type: 'string',
    default: spreadstream.inputOptions.USER_ENTERED,
    choices: Object.values(spreadstream.inputOptions),
    description: 'Type of insertion (see sheet api)'
  })
  .option('max-buffer', {
    type: 'number',
    default: 5000,
    description: 'Buffer max size before flushing to spreadsheet (default: 10000)'
  })
  .option('csv-separator', {
    type: 'string',
    description: 'Csv parser: optional separator'
  })
  .option('csv-quote', {
    type: 'string',
    description: 'Csv parser: optional quote character'
  })
  .option('csv-escape', {
    type: 'string',
    description: 'Csv parser: optional quote escape (default to quote character)'
  })
  .option('csv-newline', {
    type: 'string',
    description: 'Csv parser: optional new line'
  })
  .option('csv-headers', {
    type: 'array',
    description: 'Csv parser: specify headers'
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

// Read csv options:
const csvOptions = {
  separator: argv['csv-separator'],
  quote: argv['csv-quote'],
  escape: argv['csv-escape'],
  newline: argv['csv-newline'],
  headers: argv['csv-headers']
}

// Handle errors
function handleError (error) {
  console.error('Error:', error.message)
  process.exit(1)
}

// Collect data
try {
  stream
  .pipe(csv(csvOptions))
  .pipe(spreadstream(argv))
  .on('error', handleError)
} catch (error) {
  handleError(error)
}
