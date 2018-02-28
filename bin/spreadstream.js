#!/usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const rc = require('rc')
const fs = require('fs')
const spreadstream = require('../lib/spreadstream')
const csvParser = require('csv-parser')
const csvWriter = require('csv-write-stream')
const ndjson = require('ndjson')
const miss = require('mississippi')
const { fromCallback } = require('bluebird')
const initializer = require('../lib/initializer')

const enums = spreadstream.enums

const APPNAME = path.basename(__filename, path.extname(__filename))
const config = rc(APPNAME, {})
const argv = yargs
  .usage(`${APPNAME} [options]`)
  .config(config)
  .config('settings', function (configPath) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  })
  .command('*', 'Default command', function (yargs) {
    return yargs
      .option('id', {
        type: 'string',
        required: true,
        alias: ['spreadsheet-id'],
        description: 'Identifier of the spreadsheet document'
      })
      .option('sheet', {
        type: 'string',
        required: true,
        alias: 's',
        description: 'Title of the document sheet'
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
        choices: Object.values(enums.valueInput),
        description: 'Determines how input data should be interpreted'
      })
      .option('major-dimension', {
        type: 'string',
        choices: Object.values(enums.majorDimension),
        description: 'Indicates which dimension read operation should apply to'
      })
      .option('value-render', {
        type: 'string',
        choices: Object.values(enums.valueRender),
        description: 'Determines how values should be rendered in the the output while reading'
      })
      .option('date-time-render', {
        type: 'string',
        default: enums.dateTimeRender.SERIAL_NUMBER,
        choices: Object.values(enums.dateTimeRender),
        description: 'Determines how dates should be rendered in the the output while reading'
      })
      .option('max-buffer', {
        type: 'number',
        default: 10000,
        description: 'Buffer max size before flushing to spreadsheet'
      })
      .option('range', {
        type: 'string',
        description: 'The A1 notation of the values to retrieve (for reading). Default is all the sheet.'
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
      .option('headers', {
        type: 'array',
        description: 'Restrict headers (repeatable)'
      })
      .option('json', {
        type: 'boolean',
        default: false,
        description: 'Input / output format should use json'
      })
      .option('input', {
        type: 'string',
        description: 'Input file to stream to sheet instead of stdin. `-` force reading from stdin (imply writing mode)'
      })
      .option('output', {
        type: 'string',
        description: 'Output file to stream sheet data to. `-` force writing to stdout (imply reading mode)'
      })
  })
  .command('init', 'Interactive spreadstream rc file initializer', () => {}, initializer)
  .completion('completion')
  // .epilogue(fs.readFileSync(path.resolve(__dirname, './epilogue.txt'), 'utf-8'))
  .parse()

if (!argv.credential || !argv.credential.type) {
  console.error('Missing google service account credential. Provide by option or rc file. See --help for more informations.')
  process.exit(1)
}

// Read csv options:
const csvOptions = {
  separator: argv['csv-separator'],
  quote: argv['csv-quote'],
  escape: argv['csv-escape'],
  newline: argv['csv-newline'],
  headers: argv['headers']
}

// Reading or writing ?
if (argv.output) {
  argv.mode = enums.mode.READING
} else if (argv.input) {
  argv.mode = enums.mode.WRITING
} else {
  // Writing sheet from stdin if process is not a TTY
  argv.mode = process.stdin.isTTY
    ? enums.mode.READING
    : enums.mode.WRITING
}

// Handle errors
function handleError (error) {
  if (argv.verbose) {
    console.error(error.stack)
  } else {
    console.error('Error:', error.message, '(see --verbose for more)')
  }
  process.exit(1)
}

/**
 * Execute a the read command
 * @param  {Object} config
 * @return {Promise}
 */
async function doRead (config) {
  const outputStream = config.output && config.output !== '-'
    ? fs.createWriteStream(config.output)
    : process.stdout

  // Read sheet values
  let values = await spreadstream.readDocument(argv)

  // Empty or the sheet does not exists
  if (!values.length) { return }

  const firstRow = values.shift()
  const headers = argv.headers || firstRow

  let rows
  csvOptions.sendHeaders = true

  if (!values.length && !argv.json) {
    // Output only headers
    csvOptions.sendHeaders = false
    values.push(headers)
  }

  rows = values.map(row => {
    return firstRow.reduce((memo, value, index) => {
      if (headers.includes(value)) {
        memo[value] = row[index]
      }
      return memo
    }, {})
  })

  const serializer = argv.json ? ndjson.serialize() : csvWriter(csvOptions)

  miss.from.obj(rows)
    .pipe(serializer)
    .pipe(outputStream)
}

/**
 * Execute a the write command
 * @param  {Object} config
 * @return {Promise}
 */
async function doWrite (config) {
  const inputStream = config.input && config.input !== '-'
    ? fs.createReadStream(config.input)
    : process.stdin

  const parser = argv.json ? ndjson.parse() : csvParser(csvOptions)
  const outputStream = spreadstream(argv)

  return fromCallback(cb => miss.pipe(inputStream, parser, outputStream, cb))
}

if (argv.mode === enums.mode.READING) {
  doRead(argv).catch(handleError)
} else {
  doWrite(argv).catch(handleError)
}
