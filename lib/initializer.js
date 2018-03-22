const inquirer = require('inquirer')
const chalk = require('chalk')
const { OAuth2Client } = require('google-auth-library')
const fc = require('bluebird').fromCallback

module.exports = initializer

async function initializer (argv) {
  // console.log('INit', argv)
  const config = {
    id: argv.id,
    sheet: argv.sheet,
    replace: argv.replace,
    verbose: argv.verbose,
    valueInputOptions: argv.valueInputOptions,
    majorDimension: argv.majorDimension,
    valueRenderOption: argv.valueRenderOption,
    dateTimeRender: argv.dateTimeRender,
    maxBuffer: argv.maxBuffer,
    range: argv.range,
    csvSeparator: argv.csvSeparator,
    csvQuote: argv.csvQuote,
    csvEscape: argv.csvEscape,
    csvNewline: argv.csvNewline,
    readHeaders: argv.readHeaders,
    writeHeaders: argv.writeHeaders,
    json: argv.json,
    jsonClassic: argv.jsonClassic,
    jsonRaw: argv.jsonRaw,
    input: argv.input,
    output: argv.output,
    graceful: argv.graceful
  }
  console.log(chalk`{bold Spreadstream config generator}`)
  console.log(chalk`{grey This tool will assist you in the creation of a spreadstreamrc file}`)
  console.log()

  if (await confirm('Do you want to configure a credential access?')) {
    switch (await choose([
      { value: 'oauth2', name: 'Oauth2 credential to setup an access with your own account' },
      { value: 'service_account', name: 'Service account credentials (NOT AVAILABLE)' }
    ], 'What kind of credential do you want to setup?')) {
      case 'oauth2':
        config.credential = await initCredentialOauth2(argv)
        break
      case 'service_account':
        config.credential = await initCredentialServiceAccount(argv)
        break
    }
  }
  console.log()
  console.log(chalk`{bold Here is your spreadstreamrc configuration}`)
  console.log('Copy-paste the configuration below in one of the valid rc file location')
  console.log('  - ./.spreadstreamrc')
  console.log('  - $HOME/.spreadstreamrc')
  console.log('  - $HOME/config/spreadstream')
  console.log('  - See https://www.npmjs.com/package/rc#standards for other possible locations')
  console.log()
  console.log('----------------------------------------------------------------------------------------')
  console.log(JSON.stringify(config, null, 2))
  console.log('----------------------------------------------------------------------------------------')
}

async function initCredentialOauth2 (argv) {
  const current = argv.credential || {}
  const result = {
    type: 'oauth2',
    client_id: current.client_id,
    client_secret: current.client_secret
  }

  console.log(chalk`{grey You must first create a Cloud plateform project on https://console.cloud.google.com/}`)
  console.log(chalk`{grey You must, then create a Oauth2 access as described here https://support.google.com/cloud/answer/6158849?hl=en&ref_topic=6262490}`)

  result.client_id = await input('Client ID', result.client_id)
  result.client_secret = await input('Client secret', result.client_secret)

  const oauth2Client = new OAuth2Client(result.client_id, result.client_secret, 'urn:ietf:wg:oauth:2.0:oob')
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/spreadsheets'
  })

  console.log()
  console.log()
  console.log(chalk`{bold Please, visite this url in order to obtain a token key}`)
  console.log(`\n     ${url}\n\n`)

  const code = await input('Enter the code:')
  result.tokens = await fc(cb => oauth2Client.getToken(code, cb))

  return result
}

async function initCredentialServiceAccount (argv) {
  console.log('(not implemented yet. Please add manually credential for a service_account obtained on https://console.cloud.google.com/)')
  return {
    type: 'service_account'
  }
}

async function input (message, def, opt = {}) {
  return (await inquirer.prompt([{
    validate: _ => Boolean(_.length) || 'Required',
    ...opt,
    name: 'input',
    type: 'input',
    message,
    default: def
  }])).input
}

async function confirm (message, def = false) {
  return (await inquirer.prompt([{
    name: 'confirm',
    type: 'confirm',
    message,
    default: def
  }])).confirm
}

async function choose (choices, message = 'Choose:', def) {
  return (await inquirer.prompt([{
    name: 'choice',
    type: 'list',
    choices,
    message,
    default: def
  }])).choice
}
