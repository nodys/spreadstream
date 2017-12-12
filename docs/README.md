# spreadstream

Stream data to google spreadsheet document with a cli for csv stream.

# Cli


## Installation
Install spreadstream globally:

```sh
npm install -g spreadstream
```

Create a `spreadstream` [rc](https://www.npmjs.com/package/rc) file with your google service account (see [below](#create-a-service-account)) and any other command line options. `spreadstream` will look for any [standard rc file path](https://www.npmjs.com/package/rc#standards).

```js
// .spreadstreamrc
{
  "credential": {
    "type": "service_account",
    // ... other configs
  },
  // You can default value for any spreadstream command line options...
  "id": "spreadsheet id",
  "sheet": "My Sheet",
  // .. etc.
}
```

## Usage

```sh
# Pipe csv to spreadstream (append new rows to the sheet)
cat mydocument.csv | spreadstream

# Or read a csv file
spreadstream mydocument.csv

# Choose the sheet:
cat mydocument.csv | spreadsheet --sheet "My Sheet"

# Clear sheet first (replace)
cat mydocument.csv | spreadsheet --replace
```

## Options

See `spreadstream --help`:

```
spreadstream [options] [input csv file]

Options:
  --help                Show help                                      [boolean]
  --version             Show version number                            [boolean]
  --credential          Google service account credential config file   [string]
  --id, -i              Identifier of the spreadsheet document
                                                             [string] [required]
  --sheet, -s           Name of the sheet                    [string] [required]
  --replace             Replace data in the sheet (clear all values in the
                        sheet)                                         [boolean]
  --verbose             Print some informations       [boolean] [default: false]
  --value-input-option  Type of insertion (see sheet api)
             [string] [choices: "USER_ENTERED", "RAW"] [default: "USER_ENTERED"]
  --max-buffer          Buffer max size before flushing to spreadsheet (default:
                        10000)                          [number] [default: 5000]
  --csv-separator       Csv parser: optional separator                  [string]
  --csv-quote           Csv parser: optional quote character            [string]
  --csv-escape          Csv parser: optional quote escape (default to quote
                        character)                                      [string]
  --csv-newline         Csv parser: optional new line                   [string]
  --csv-headers         Csv parser: specify headers                      [array]

This tool require a Google Service Account with write permission.
You must create an service account add share the spreadsheet with the
account email (see below for details).

Then, you can either:

- Use the --credential targeting an user account config file
- Add a rc file for ${APPNAME} (eg. ~/.config/${APPNAME}/config) with a
  credential key (see https://www.npmjs.com/package/rc for valid rc
  file path).
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
  verbose: false
}

// Create a stream
const stream = spreadstream(config)

// Pipe an object stream or write directly to the stream
stream.write(['foo', 'bar'])
stream.write(['4', '2'])
stream.write(['7', '10'])
stream.end()
```

# Create a service account

1. Go to the [Google Developers Console](https://console.developers.google.com/project)
2. Select your project or create a new one (and then select it)
3. Enable the Drive API for your project
  - In the sidebar on the left, expand __APIs & auth__ > __APIs__
  - Search for "drive"
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

Your credential account file (or the spreadstream rc file) should look like this:

```json
{
  "credential": {
    "type": "service_account",
    "project_id": "spreadstream-xxxx",
    "private_key_id": "xxxx",
    "private_key": "-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n",
    "client_email": "spreadstream@spreadstream-xxxx.iam.gserviceaccount.com",
    "client_id": "00000000",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/spreadstream%40spreadstream-xxxx.iam.gserviceaccount.com"
  }
}
```


(credit: https://github.com/theoephraim/node-google-spreadsheet/blob/master/README.md#service-account-recommended-method)
