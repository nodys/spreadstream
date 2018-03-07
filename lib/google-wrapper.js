const { google } = require('googleapis')
const { GoogleAuth, OAuth2Client } = require('google-auth-library')

/**
 * Sheet api
 * @type {Object}
 */
exports.sheets = google.sheets('v4')

/**
 * Authenticate service account
 * @param  {Object} credential Service account credential
 * @return {Promise<Object>} Google auth instance
 */
/* istanbul ignore next reason: Mocked during test */
exports.authenticate = async function (credential) {
  switch (credential.type) {
    case 'service_account':
      const googleAuth = new GoogleAuth()
      const auth = googleAuth.fromJSON(credential)
      auth.scopes = ['https://www.googleapis.com/auth/spreadsheets']
      await auth.authorize()
      return auth
    case 'oauth2':
      const oAuth2Client = new OAuth2Client(
        credential.client_id,
        credential.client_secret,
        'urn:ietf:wg:oauth:2.0:oob'
      )
      oAuth2Client.setCredentials(credential.tokens)
      return oAuth2Client
    default:
      throw new Error('Unregistered credential type')
  }
}
