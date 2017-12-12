# spreadstream

Pipe csv stream to google spreadsheet

# Install

TBD

# Usage

TBD

# Create a credential account
(credit: https://github.com/theoephraim/node-google-spreadsheet/blob/master/README.md#service-account-recommended-method)

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

(credit: https://github.com/theoephraim/node-google-spreadsheet/blob/master/README.md#service-account-recommended-method)
