const { google } = require('googleapis')
const { GoogleAuth } = require('google-auth-library')

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
  const googleAuth = new GoogleAuth()
  const auth = googleAuth.fromJSON(credential)
  auth.scopes = ['https://www.googleapis.com/auth/spreadsheets']
  await auth.authorize()
  return auth
}
