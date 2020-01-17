#!/usr/bin/env node

'use strict'

const program = require('commander')
const { generateFilesFromSpreadsheet } = require('./lib')

// Used to get version number from package.json
require('pkginfo')(module, 'version')

// Default values used in documentation and script
const DEFAULT_WORKSHEET_INDEX = 0
const DEFAULT_CLIENT_SECRET_FILENAME = './client_secret.json'
const DEFAULT_CREDENTIALS_FILENAME = './credentials.json'
const DEFAULT_RANGE = 'Data!A1:Z10'
const DEFAULT_LANG_INDEX = 2
const DEFAULT_KEY_INDEX = 1
const DEFAULT_OUTPUT_DIR = './data'

// Parse arguments and generate documentation
program
	.version(module.exports.version, '-v, --version')
	.option(
		'-f, --file <path>',
		`path of file to parse (only with Excel file). required if no --spreadsheet`
	)
	.option(
		'-w, --worksheet <index>',
		`index of worksheet to parse (only with Excel file). defaults ${DEFAULT_WORKSHEET_INDEX}`
	)
	.option(
		'-c, --client <path>',
		`path of client secret file (only with Google Spreadsheet). defaults to ${DEFAULT_CLIENT_SECRET_FILENAME}`
	)
	.option(
		'-t, --token <path>',
		`path of credentials file (only with Google Spreadsheet). defaults to ${DEFAULT_CREDENTIALS_FILENAME}`
	)
	.option(
		'-s, --spreadsheet <id>',
		'id of spreadsheet to parse (only with Google Spreadsheet). required if no --file'
	)
	.option(
		'-r, --range <range>',
		`range of data to parse (only with Google Spreadsheet). defaults ${DEFAULT_RANGE}`
	)
	.option('-l, --lang <index>', `index of first translation column. defaults ${DEFAULT_LANG_INDEX}`)
	.option('-k, --key <index>', `index of key column. defaults ${DEFAULT_KEY_INDEX}`)
	.option('-o, --output <path>', `path of output directory. defaults to ${DEFAULT_OUTPUT_DIR}`)
	.option('-j, --json', 'generate JSON files instead of JS files')
	.parse(process.argv)

// Spreadsheet parameters
const CLIENT_SECRET_FILENAME = program.client || DEFAULT_CLIENT_SECRET_FILENAME
const CREDENTIALS_FILENAME = program.token || DEFAULT_CREDENTIALS_FILENAME
const RANGE = program.range || DEFAULT_RANGE

// Common parameters
const LANG_INDEX = program.lang || DEFAULT_LANG_INDEX
const KEY_INDEX = program.key || DEFAULT_KEY_INDEX
const OUTPUT_DIR = program.output || DEFAULT_OUTPUT_DIR

// Run script
if (program.spreadsheet) {
	generateFilesFromSpreadsheet(
		program.spreadsheet,
		RANGE,
		CLIENT_SECRET_FILENAME,
		CREDENTIALS_FILENAME,
		LANG_INDEX,
		KEY_INDEX,
		OUTPUT_DIR,
		program.json
	)
} else {
	console.error('--file or --spreadsheet is required')
}
