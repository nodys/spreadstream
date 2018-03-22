# spreadstream
[![Build Status](https://travis-ci.org/nodys/spreadstream.svg?branch=master)](https://travis-ci.org/nodys/spreadstream) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![Clussh on npm](https://img.shields.io/npm/v/spreadstream.svg)](https://www.npmjs.com/package/spreadstream)

Pipe data from and to google spreadsheet

---

<p align="center">
  <img src="https://nodys.github.io/spreadstream/spreadstream.png" alt="clussh">
</p>

Read
```sh
spreadstream > data.csv
spreadstream --json > data.ndjson
```

Write
```sh
cat data.csv | spreadstream
cat data.ndjson | spreadstream --json
```

---

##  Install

```sh
npm install -g spreadstream
```

Then:

1. [Create a Google authentication token](#google-authentication-token) and make sure the account (or the service account) can access the spreadsheets you plan to use.
2. Create a [rc file](#rc-file) with your authentication token


## Configuration

### Google authentication token
You need to create a Google authentication token for the Google Sheet Api: either a [service account](#create-a-service-account) or a [OAuth 2 token](#create-oauth2-token) to use your own account.

Once created, put your credentials in a [rc file](#rc-file) as described below.


### Rc file
The rc file must contain the `credential` key with the google authentication token created previously. You can add any other spreadstream options (see `spreadstream --help`). The location of the rc file depend on your needs: either at a [standard rc file path](https://www.npmjs.com/package/rc) or specified using the `--settings` option.

*You can too try the new (alpha) spreadstream config generator which supports Oauth2 authentication: `spreadstream init`*

**Exemple:**

```js
// .spreadstreamrc
{
  // Your google authentication token created previously:
  "credential": {
    "type": "service_account",
    "project_id": "xxxxx",
    "private_key_id": "xxxxx",
    "private_key": "xxxxx",
    "client_email": "xxxxx@xxxxx",
    "client_id": "xxxxx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/xxxxx"
  },
  // You can set default value for any spreadstream command line options...
  "id": "spreadsheet id", // The document id from the spreadsheet url
  "sheet": "My Sheet",    // The sheet title in your document
  "json": true
  // ...
}
```

## Usage

The examples below depends on the availability of a [rc file](#rc-file) containing a valid `credential`, a spreadsheet document `id` and a `sheet` title.

### Write data to Google Spreadsheet

```sh
# Pipe csv to spreadstream (append new rows to the sheet)
cat mydocument.csv | spreadstream

# Or read a csv file
spreadstream --input mydocument.csv

# Choose the document and the sheet (or use configuration file):
cat mydocument.csv | spreadstream --id="ya29.GlsiBTHclgwXhCs3dJZHp" --sheet "My Sheet"

# Clear sheet first (replace)
cat mydocument.csv | spreadstream --replace

# Pipe line delimited json instead of csv
cat mydocument.ndjson | spreadstream --json
```

### Read data from Google Spreadsheet

```sh
# Read sheet
spreadstream

# Choose the document and the sheet (or use configuration file):
spreadstream --id="ya29.GlsiBTHclgwXhCs3dJZHp" --sheet "My Sheet"

# Limit reading range with A1 notation
# https://developers.google.com/sheets/api/guides/concepts#a1_notation
spreadstream --range="A:C"
spreadstream --range="A1:C4"
spreadstream --range="1:4"
spreadstream --range="My Sheet!1:4" # Override sheet

# Change csv output (same options than for input):
spreadstream --csv-separator ";"

# output as line delimited json instead of csv
spreadstream --json

# Write output to a file
spreadstream > myfile.csv
spreadstream --output myfile.csv
```

### Options

See too `spreadstream --help` for detailed command line usage, options and default values.

The [API](#api) use the camelCase version for the dashed options names. Every option can be set in the [rc file](#rc-file) using either camelCase or kebab-case format.

- `--id`
   Identifier of the spreadsheet document
   <small>The spreadsheet document id is the long unique identifier in the URL of the document looking like `Dh9CsT4eXiTeKQLWZLpM..`</small>
- `--sheet`
   Title of the sheet in the document
- `--replace`
   Write in overwrite mode: replace the content of the sheet (the default behavior is to append new rows at the end)
- `--verbose`
  Be verbose about what is done (on stderr)
- `--value-input`
  Determines how input data should be interpreted (default: `USER_ENTERED`) ([more](https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption))
- `--major-dimension`
  Indicates which dimension read operation should apply to (default: `ROWS`) ([more](https://developers.google.com/sheets/api/reference/rest/v4/Dimension))
- `--value-render`
  Determines how values should be rendered in the the output while reading (default: `FORMATTED_VALUE`) ([more](https://developers.google.com/sheets/api/reference/rest/v4/valueRender))
- `--date-time-render`
   Determines how dates should be rendered in the the while reading (default: `SERIAL_NUMBER`) ([more](https://developers.google.com/sheets/api/reference/rest/v4/dateTimeRender))
- `--max-buffer`
   Buffer max size before flushing to spreadsheet (default: `1000`).
   How many row of data should be sent at once to the spreadsheet while writing.
   A lower value would negatively impact speed and API usage limits, but it will produce atomic update of your document when used with light and slow stream of data (eg. a line-delimited-json log producer).
- `--range`
   Fore reading: The A1 notation of the values to retrieve. Default is to select the whole sheet.
   Exemples: `A1:D3` a 4x3 range, `A:D` the four first columns, `12:30` for lines from 12 to 30
- `--csv-separator`
   Csv separator (both for the parser and the writer).
   Default to auto-detect and `,`
- `--csv-quote`
   Csv quote (both for the parser and the writer)
   Default to auto-detect and `"`
- `--csv-escape`
   Csv quote escaping (both for the parser and the writer)
   Default to auto-detect and `""`
- `--csv-newline`
   Csv new line character
   Default to auto-detect and `\n`
- `--read-headers` (default: true)
  The first chunk in the input feed should be used as headers (prefix with `--no-` to disable)
  If false:
  - When reading from json, this option has no effect.
  - When reading from csv, the first line is not interpreted as headers (and default headers are generated)
  - When reading from spreadsheet, the first line is not interpreted as headers (and default headers are generated)
- `--write-headers` (default: true)
  The first chunk in the output feed should include headers
  If false:
  - When writing to json, this option has no effect.
  - When writing to csv the headers are omitted
  - When writing to spreadsheet the headers are omitted
- `--noheaders` (default: false)
  Alias for `--no-read-headers` and `--no-write-headers`
- `--json`
   Use [new line delimited json](http://ndjson.org/) parser and writer instead of csv as input and output.
- `--classic-json`
   Input / output format should use classic json serializer and parser instead of line delimited json (read and produce a json array)
- `--input`
   Set input file. Default is to read from stdin outside of a tty environment.
   Reading from stdin can be forced by setting this option to `-`.
- `--output`
   Set output file. Default is to write to stdout.
   Writing to stdout can be forced by setting this option to `-`.
- `completion`
   Generate bash completion code (`spreadstream completion >> $HOME/.bashrc`)

## Api

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
  verbose: false
}

// Create a stream
const stream = spreadstream(config)

// Pipe an object stream or write directly to the stream.
// The spreadstream stream supports to kind of object stream: Array or Object.
// Note that you can not push a mixed stream of array and object.

// Stream of Array:
// Each array is a row in the sheet. The first row will be interpreted has
// headers (unless readHeaders if false)
const stream1 = spreadstream(config)
stream1.write(['foo', 'bar'])
stream1.write(['4', '2'])
stream1.write(['7', '10'])
stream1.end()


// Stream of Object
const stream2 = spreadstream(config)
stream2.write({ foo: 4, bar: 2 })
stream2.write({ foo: 7, bar: 10 })
stream2.end()


// Pipe data from stdin (eg. with ndjson):
process.stdin
  .pipe(require('ndjson').parse())
  .pipe(spreadstream(config))

// Read a document
spreadstream.readDocument(config).then(values => console.log(values))

```

## Create a service account

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and then select it)
3. Enable the Google Sheets API for your project
   - Search for "sheet"
   - In the sidebar on the left, expand __APIs & auth__ > __APIs__
   - Click on "[Google Sheets API](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview)"
   - Click the blue "Enable API" button
4. Create a service account for your project
   - In the sidebar on the left, expand __APIs & auth__ > __Credentials__
   - Click blue "Create credentials" button
   - Select the "Create service account key" option
   - Select "New service account"
   - Keep the "JSON" key type option selected
   - Click blue "Create" button and complete the form
   - Your JSON key file is generated and downloaded to your machine
     (__it is the only copy!__)
   - Note your service account's *email address* (also available in the JSON
     key file)
5. Add the content of the JSON file in your spreadstream rc file (eg. `./.spreadstreamrc` or `~/.config/spreadstream/config`):
   ```json
   {
     "credential": {
        "type": "service_account",
        "project_id": "xxxxx",
        "private_key_id": "xxxxx",
        "private_key": "xxxxx",
        "client_email": "xxxxx@xxxxx",
        "client_id": "xxxxx",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/xxxxx"
      }
   }
   ```
6. Share the doc (or docs) with your service account using the email
   noted above

## Create Oauth2 token

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and then select it)
3. Enable the Google Sheets API for your project
   - Search for "sheet"
   - In the sidebar on the left, expand __APIs & auth__ > __APIs__
   - Click on "[Google Sheets API](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview)"
   - Click the blue "Enable API" button
4. Create a Oauth credential
   - In the sidebar on the left, expand __APIs & auth__ > __Credentials__
   - Click blue "Create credentials" button
   - Select the "OAuth 2.0 client IDs" option
   - Select "Other" and give a name
   - Click blue "Create" button
   - Copy the client id (`CLIENT_ID` below) and the secret key (`CLIENT_SECRET` below)
5. Edit you spreadstream rc file (eg. `~/.config/spreadstream/config`):
   ```json
   {
     "type": "oauth2",
     "client_id": "CLIENT_ID",
     "client_secret": "CLIENT_SECRET",
     "tokens": { }
   }
   ```
6. Complete the


*(credit: [node-google-spreadsheet]( https://github.com/theoephraim/node-google-spreadsheet/blob/master/README.md#service-account-recommended-method))*

---

License: [MIT](./LICENSE) - Novadiscovery
