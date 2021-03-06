#!/usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const rc = require('rc')
const fs = require('fs')
const spreadstream = require('../lib/spreadstream')
const csvParse = require('csv-parse')
const csvWriter = require('csv-write-stream')
const ndjson = require('ndjson')
const miss = require('mississippi')
const { fromCallback } = require('bluebird')
const initializer = require('../lib/initializer')

const streams = spreadstream.streams
const enums = spreadstream.enums

const APPNAME = path.basename(__filename, path.extname(__filename))
const config = rc(APPNAME, {})
yargs
  .usage(`${APPNAME} [options]`)
  .config(config)
  .config('settings', function (configPath) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  })
  .command('*', 'Default command', function (yargs) {
    return yargs
      .option('id', {
        type: 'string',
        // required: true,
        alias: ['spreadsheet-id'],
        description: 'Identifier of the spreadsheet document'
      })
      .option('sheet', {
        type: 'string',
        // required: true,
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
      .option('value-input', {
        type: 'string',
        alias: ['value-input-option'],
        choices: Object.values(enums.valueInputOption),
        description: 'Determines how input data should be interpreted'
      })
      .option('major-dimension', {
        type: 'string',
        choices: Object.values(enums.majorDimension),
        description: 'Indicates which dimension read operation should apply to'
      })
      .option('value-render', {
        type: 'string',
        alias: ['value-render-option'],
        choices: Object.values(enums.valueRenderOption),
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
      .option('read-headers', {
        type: 'boolean',
        default: true,
        description: 'The first chunk in the input feed should be used as headers (prefix with --no- to disable)'
      })
      .option('write-headers', {
        type: 'boolean',
        default: true,
        alias: ['csv-send-headers'],
        description: 'The first chunk in the output feed should include headers (prefix with --no- to disable)'
      })
      .option('noheaders', {
        type: 'boolean',
        description: 'If enabled, alias for --no-write-headers and --no-read-headers'
      })
      .option('json', {
        type: 'boolean',
        default: false,
        description: 'Input / output format should use line delemited json (one line = one json)'
      })
      .option('json-classic', {
        type: 'boolean',
        alias: ['classic-json'],
        default: false,
        description: 'Input / output format should use classic json serializer (array of json)'
      })
      .option('json-raw', {
        type: 'boolean',
        default: false,
        description: 'Keep raw values in json output while reading: do not try to parse boolean and numbers (use only string values)'
      })
      .option('input', {
        type: 'string',
        description: 'Input file to stream to sheet instead of stdin. `-` force reading from stdin (imply writing mode)'
      })
      .option('output', {
        type: 'string',
        description: 'Output file to stream sheet data to. `-` force writing to stdout (imply reading mode)'
      })
      .option('graceful', {
        type: 'boolean',
        default: false,
        description: 'Gracefully ignore reading errors - just print a warning'
      })
      .option('transform-out', {
        type: 'string',
        description: 'Apply a the fonction exported by the selected node module to each output values (experimental)',
        coerce: function (arg) {
          return require(path.resolve(process.cwd(), arg))
        }
      })
  }, defaultAction)
  .command('init', 'Interactive spreadstream rc file initializer', () => {}, initializer)
  .completion()
  // .epilogue(fs.readFileSync(path.resolve(__dirname, './epilogue.txt'), 'utf-8'))
  .parse()

function defaultAction (argv) {
  if (!argv.credential || !argv.credential.type) {
    console.error('Missing google service account credential. Provide by option or rc file. See --help for more informations.')
    process.exit(1)
  }

  if (argv.noheaders === true) {
    argv['write-headers'] = argv['writeHeaders'] = false
    argv['read-headers'] = argv['readHeaders'] = false
  }

  // Shared csv options:
  argv.csvOptions = {
    separator: argv['csv-separator'],
    quote: argv['csv-quote'],
    escape: argv['csv-escape'],
    newline: argv['csv-newline'],
    sendHeaders: argv['write-headers']
  }

  // Reading or writing ?
  if (argv.output !== undefined) {
    argv.mode = enums.mode.READING
  } else if (argv.input !== undefined) {
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
   * Execute the read command
   * @param  {Object} config
   * @return {Promise}
   */
  async function doRead (config) {
    const outputStream = config.output && config.output !== '-'
      ? fs.createWriteStream(config.output)
      : process.stdout

    const csvOptions = {
      ...config.csvOptions
    }

    // Read sheet values
    let values = await spreadstream.readDocument(argv)

    // Empty or the sheet does not exists
    if (!values.length) { return }

    const headers = values.shift()

    let rows

    if (!values.length && !argv.json && !argv.classicJson) {
      // Output only headers
      csvOptions.sendHeaders = false
      values.push(headers)
    }

    rows = values.map(row => {
      return headers.reduce((memo, value, index) => {
        memo[value] = row[index]
        return memo
      }, {})
    })

    // Experimental output transformation
    if (argv.transformOut) {
      for (let [index, row] of rows.entries()) {
        rows[index] = await Promise.resolve(argv.transformOut(row, { index, rows, config }))
      }
    }

    let serializer

    if (argv.classicJson) {
      serializer = streams.classicJsonOutputStream()
    } else if (argv.json) {
      serializer = ndjson.serialize()
    } else {
      serializer = csvWriter(csvOptions)
    }

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

    const csvOptions = {
      ...config.csvOptions,
      // csv-parse does not use the same option keys than csv-write-stream or csv-parser:
      delimiter: config.csvOptions.separator,
      rowDelimiter: config.csvOptions.newline
    }

    let parser

    if (argv.classicJson) {
      parser = streams.classicJsonInputStream()
    } else if (argv.json) {
      parser = ndjson.parse()
    } else {
      parser = csvParse(csvOptions)
    }
    const outputStream = spreadstream(argv)

    return fromCallback(cb => miss.pipe(inputStream, parser, outputStream, cb))
  }

  if (argv.mode === enums.mode.READING) {
    doRead(argv).catch(handleError)
  } else {
    doWrite(argv).catch(handleError)
  }
}
