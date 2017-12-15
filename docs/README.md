# spreadstream
[![Build Status](https://travis-ci.org/nodys/spreadstream.svg?branch=master)](https://travis-ci.org/nodys/spreadstream) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Clussh on npm](https://img.shields.io/npm/v/spreadstream.svg)](https://www.npmjs.com/package/spreadstream)

Pipe data from and to google spreadsheet

---

<p align="center">
  <img src="https://nodys.github.io/spreadstream/spreadstream.png" alt="clussh">
</p>

---

# Cli

## Installation
Install spreadstream globally:

```sh
npm install -g spreadstream
```

Create a `spreadstream` [rc](https://www.npmjs.com/package/rc) file with your google service account (see [below](#create-a-service-account)) and any other command line options. `spreadstream` will look for any [standard rc file path](https://www.npmjs.com/package/rc#standards).

See [configuration](#configuration) for detailled instructions.

## Usage

### Write data to google spreadsheet

```sh
# Pipe csv to spreadstream (append new rows to the sheet)
cat mydocument.csv | spreadstream

# Or read a csv file
spreadstream --input mydocument.csv

# Choose the document and the sheet (or use configuration file):
cat mydocument.csv | spreadsheet --id="ya29.GlsiBTHclgwXhCs3dJZHp" --sheet "My Sheet"

# Clear sheet first (replace)
cat mydocument.csv | spreadsheet --replace

# Pipe line delimited json instead of csv
cat mydocument.ndjson | spreadsheet --json
```

### Read data from google spreadsheet

```sh
# Read sheet
spreadsheet

# Choose the document and the sheet (or use configuration file):
spreadsheet --id="ya29.GlsiBTHclgwXhCs3dJZHp" --sheet "My Sheet"

# Limit reading range with A1 notation
# https://developers.google.com/sheets/api/guides/concepts#a1_notation
spreadsheet --range="A:C"
spreadsheet --range="A1:C4"
spreadsheet --range="1:4"
spreadsheet --range="My Sheet!1:4" # Override sheet

# Change csv output (same options than for input):
spreadsheet --csv-separator ";"

# output as line delimited json instead of csv
spreadsheet --json

# Write output to a file
spreadsheet > myfile.csv
spreadsheet --output myfile.csv
```

### Options

See `spreadstream --help`:

```
spreadstream [options]

Options:
  --help                  Show help                                    [boolean]
  --version               Show version number                          [boolean]
  --settings              Path to JSON config file
  --id, --spreadsheet-id  Identifier of the spreadsheet document
                                                             [string] [required]
  --sheet, -s             Name of the sheet                  [string] [required]
  --replace               Replace data in the sheet (clear all values in the
                          sheet)                                       [boolean]
  --verbose               Print some informations     [boolean] [default: false]
  --value-input-option    Determines how input data should be interpreted
                                       [string] [choices: "USER_ENTERED", "RAW"]
  --major-dimension       Indicates which dimension read operation should apply
                          to               [string] [choices: "COLUMNS", "ROWS"]
  --value-render          Determines how values should be rendered in the the
                          output
           [string] [choices: "FORMATTED_VALUE", "UNFORMATTED_VALUE", "FORMULA"]
  --date-time-render      Determines how dates should be rendered in the the
                          output
               [string] [choices: "SERIAL_NUMBER", "FORMATTED_STRING"] [default:
                                                                "SERIAL_NUMBER"]
  --max-buffer            Buffer max size before flushing to spreadsheet
                          (default: 10000)              [number] [default: 5000]
  --csv-separator         Csv parser: optional separator                [string]
  --csv-quote             Csv parser: optional quote character          [string]
  --csv-escape            Csv parser: optional quote escape (default to quote
                          character)                                    [string]
  --csv-newline           Csv parser: optional new line                 [string]
  --csv-headers           Csv parser: specify headers                    [array]
  --json                  Input / output format should use json
                                                      [boolean] [default: false]
  --input                 Input file to stream to sheet instead of stdin. `-`
                          force reading from stdin (imply writing mode) [string]
  --output                Output file to stream sheet data to. `-` force writing
                          to stdout (imply reading mode)                [string]
```

## Configuration

You will need google api credential for the Google Sheet Api.

Two solutions are available:

- [Create a service account](#create-a-service-account) and share your document with the generated account email.
- Or use [googleauth](https://github.com/maxogden/googleauth) to create a credential to your own account

Once created, put your credential in a [Rc file](#rc-file).

### Create a service account

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and then select it)
3. Enable the Drive API for your project
   - Search for "drive"
   - In the sidebar on the left, expand __APIs & auth__ > __APIs__
   - Click on "Drive API"
   - Click the blue "Enable API" button
4. Create a service account for your project
   - In the sidebar on the left, expand __APIs & auth__ > __Credentials__
   - Click blue "Add credentials" button
   - Select the "Service account" option
   - Select "Furnish a new private key" checkbox
   - Select the "JSON" key type option
   - Click blue "Create" button
   - Your JSON key file is generated and downloaded to your machine
     (__it is the only copy!__)
   - Note your service account's email address (also available in the JSON
     key file)
5. Share the doc (or docs) with your service account using the email
   noted above

*(credit: [node-google-spreadsheet]( https://github.com/theoephraim/node-google-spreadsheet/blob/master/README.md#service-account-recommended-method))*

### Rc file

The rc file must contain the credential as created previously. You can add any other spreadstream options (see `spreadsheet --help`) (eg. spreadsheet `id`, `sheet` title, etc.).

Put your rc file in any [standard rc file path](https://www.npmjs.com/package/rc) or use the `--settings` option.

Exemple with a local `.spreadstreamrc` file:

```js
// .spreadstreamrc
{
  "credential": {
    "access_token": "xx",
    // ...
  },
  // You can default value for any spreadstream command line options...
  "id": "spreadsheet id",
  "sheet": "My Sheet",
  "json": true
  // ... etc.
}
```



# Api

The basic api usage

```js
const spreadstream = require('spreadstream')

const config = {
  // See below about creating a service account (required)
  credentials: require('./google-credentials.json')  

  // Spreadsheet id (see document's url) shared with the service account (required)
  id: '1jLPcDv0UaYIDh9CsT4eXiMeKQLWZLpMyAA7FjkO7Z3X',

  // The sheet title (required)
  sheet: 'My Sheet',

  // Clear sheet before adding value (default: false)
  // If true, every values in the sheet will be removed first.
  // The default behavior (replace: false) is to append rows at the bottom of
  // the sheet.
  // Headers are pushed only when replace is true or when the sheet is new.
  replace: false,

  // Input value option:
  // - USER_ENTERED: The values will be parsed as if the user typed them into the UI (the default)
  // - RAW: The values will be stored as-is.
  // See https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
  valueInputOption: spreadstream.USER_ENTERED,

  // How many row must be keept in the stream buffer before flushing
  // data to the document (default: 5000)
  maxBuffer: 5000,

  // Verbose mode (default: false)
  verbose: false,

  // Force (and restrict) headers
  //headers: ['foo', 'bar']
}

// Create a stream
const stream = spreadstream(config)

// Pipe an object stream or write directly to the stream.
// The spreadstream stream supports to kind of object stream: Array or Object.
// Note that you can not push a mixed stream of array and object.

// Stream of Array:
// Each array is a row in the sheet. The first row must contain
// the headers (either when the config `headers` option is provided)
stream.write(['foo', 'bar'])
stream.write(['4', '2'])
stream.write(['7', '10'])
stream.end()


// Stream of Object
// The first row must not contain the headers (the object keys will be used)
stream.write({ foo: 4, bar: 2 })
stream.write({ foo: 7, bar: 10 })
stream.end()


// Read a document
spreadstream.readDocument(config).then(values => console.log(values))

```


---

License: [MIT](./LICENSE) - Novadiscovery
