# google-sheets-i18n-generator

[![npm version](https://badge.fury.io/js/google-sheets-i18n-generator.svg)](https://badge.fury.io/js/google-sheets-i18n-generator)
[![Build Status](https://travis-ci.com/VictorCazanave/google-sheets-i18n-generator.svg?branch=master)](https://travis-ci.com/VictorCazanave/google-sheets-i18n-generator)
[![codecov](https://codecov.io/gh/VictorCazanave/google-sheets-i18n-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/VictorCazanave/google-sheets-i18n-generator)
[![Dependency Status](https://david-dm.org/VictorCazanave/google-sheets-i18n-generator.svg)](https://david-dm.org/VictorCazanave/google-sheets-i18n-generator)

Generate i18n JSON/JS files from a Google Sheets spreadsheet

## Installation

### npm

`npm install --save-dev google-sheets-i18n-generator`

### yarn

`yarn add --dev google-sheets-i18n-generator`

## Usage

1. Create a Google Sheets spreadsheet to store the i18n strings
   <img src="https://raw.githubusercontent.com/VictorCazanave/google-sheets-i18n-generator/master/doc/spreadsheet.png" alt="Example of spreadsheet" height="150">

2. If needed, configure Google Sheets (only the first time):
   <details>
     <summary>More details</summary>

     2.1. Enable the Google Sheets API for your project following [this documentation](https://support.google.com/googleapi/answer/6158841)

     <img src="https://raw.githubusercontent.com/VictorCazanave/google-sheets-i18n-generator/master/doc/google-sheets-api.png" alt="Menu to Google Sheets API" height="150">

     <img src="https://raw.githubusercontent.com/VictorCazanave/google-sheets-i18n-generator/master/doc/enable-google-sheets-api.png" alt="Button to enable Google Sheets API" height="150">

     2.2. Create OAuth ID credentials for your application

     <img src="https://raw.githubusercontent.com/VictorCazanave/google-sheets-i18n-generator/master/doc/create-credentials.png" alt="Menu to create credentials" height="200">

     2.3. Download the `client_secret_xxx.json` file of your application, then eventually move it to the right folder and rename it

     <img src="https://raw.githubusercontent.com/VictorCazanave/google-sheets-i18n-generator/master/doc/download-client-secret.png" alt="Button to download client secret file" height="100">
</details>

3. Copy the ID of the spreadsheet (can be found in the URL `https://docs.google.com/spreadsheets/d/<spreadsheetId>/edit#gid=0`)

4. Run the command: `gs-i18n <spreadsheetId>`

5. If needed, follow the instructions to allow `gs-i18n` to access your Google Sheets and download the `credentials.json` files (only the first time)
   <details>
     <summary>More details</summary>

     ```
     Authorize this app by visiting this url: https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fspreadsheets.readonly&response_type=code&client_id=...&redirect_uri=...
     Enter the code from that page here:
     ```

     <img src="https://raw.githubusercontent.com/VictorCazanave/google-sheets-i18n-generator/master/doc/allow-gs-i18n-access.png" alt="Button to allow gs-i18n to access Google Sheets API" height="400">
   </details>

6. The JSON files are generated in the `./locales` folder

To customize the options, see the [API section](#api).

## API

```
Usage: gs-i18n <spreadsheetId> [options]

Options:
  -v, --version            output the version number
  -b, --beautify <number>  number of spaces to insert white space in JSON/JS files (min: 0, max: 10) (default: 0)
  -c, --client <path>      path of client secret file (default: "./client_secret.json")
  -f, --format <format>    format of generated files (available values: "cjs", "esm", "json") (default: "json")
  -k, --key <index>        index of key column (default: 0)
  -l, --lang <index>       index of first language column (default: 1)
  -o, --output <path>      path of output directory (default: "./locales")
  -r, --range <range>      range of data to parse (default: "Sheet1")
  -t, --token <path>       path of credentials file (default: "./credentials.json")
  -h, --help               output usage information
```

## License

MIT
