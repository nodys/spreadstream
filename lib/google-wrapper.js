const google = require('googleapis')
const GoogleAuth = require('google-auth-library')
const { fromCallback } = require('bluebird')

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
exports.authenticate = async function (credential) {
  const googleAuth = new GoogleAuth()
  const auth = (await fromCallback(cb => googleAuth.fromJSON(credential, cb)))
    .createScoped(['https://www.googleapis.com/auth/spreadsheets'])
  return auth
}
