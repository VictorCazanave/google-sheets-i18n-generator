# google-sheets-i18n-generator

Generate i18n JSON/JS files from a Google Sheets spreadsheet

## Installation

### npm

`npm install --save-dev google-sheets-i18n-generator`

### yarn

`yarn add --dev google-sheets-i18n-generator`

## Usage

1. Create a Google Sheets spreadsheet to store the i18n strings
2. Enable the Google Sheets API following [this documentation](https://developers.google.com/sheets/api/quickstart/nodejs#step_1_turn_on_the)
3. Download the `client_secret.json` and `credentials.js` files to access the Google Sheets API
3. Copy the ID of the spreadsheet (e.g. in this URL `https://docs.google.com/spreadsheets/d/1kjNb2-Tpn_1Pcd6pid22fBQlr8nd6oa1ltXwKNj1Gz11/edit#gid=0` the ID is `1kjNb2-Tpn_1Pcd6pid22fBQlr8nd6oa1ltXwKNj1Gz11`)
4. Run the command: `gs-i18n --spreadsheet <id>`
5. The JSON files are generated in the `./locales` folder

## API

```
Usage: gs-i18n --spreadsheet <id> [options]

Options:
  -v, --version           output the version number
  -c, --client <path>     path of client secret file (defaults to ./client_secret.json)
  -f, --format <format>   format of generated files (available values are cjs, esm and json, defaults json)
  -k, --key <index>       index of key column (defaults 0)
  -l, --lang <index>      index of first language column (defaults 1)
  -o, --output <path>     path of output directory (defaults to ./locales)
  -r, --range <range>     range of data to parse (defaults Sheet1)
  -s, --spreadsheet <id>  id of spreadsheet to parse (required)
  -t, --token <path>      path of credentials file (defaults to ./credentials.json)
  -h, --help              output usage information
```

## TODO

* Improve documentation
* Create unit tests
* Improve code
