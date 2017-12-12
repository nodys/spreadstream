#!/usr/bin/env node

const yargs = require('yargs')
const path = require('path')
const rc = require('rc')
const fs = require('fs')

const APPNAME = path.basename(__filename, path.extname(__filename))
const config = rc(APPNAME, {})
const argv = yargs
  .usage(`${APPNAME} [options]`)
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
  .epilogue(fs.readFileSync(path.resolve(__dirname, './epilogue.txt'), 'utf-8'))
  .parse()

if (!argv.credential || (argv.credential.type !== 'service_account')) {
  console.error('Missing google service account credential. See help.')
  process.exit(1)
}
