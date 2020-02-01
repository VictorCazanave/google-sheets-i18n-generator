#!/usr/bin/env node

'use strict'

const program = require('commander')
const { generateFilesFromSpreadsheet } = require('./lib')

// Used to get version number from package.json
require('pkginfo')(module, 'version')

// Default values used in documentation and script
const DEFAULT_CLIENT = './client_secret.json'
const DEFAULT_FORMAT = 'json'
const DEFAULT_KEY_INDEX = 0
const DEFAULT_LANG_INDEX = 1
const DEFAULT_OUTPUT_DIR = './locales'
const DEFAULT_RANGE = 'Sheet1'
const DEFAULT_TOKEN = './credentials.json'

// Generate documentation and parse arguments
program
	.name("gs-i18n")
	.usage('--spreadsheet <id> [options]')
	.version(module.exports.version, '-v, --version')
	.option(
		'-c, --client <path>',
		`path of client secret file (defaults to ${DEFAULT_CLIENT})`,
	)
	.option(
		'-f, --format <format>',
		`format of generated files (available values are cjs, esm and json, defaults ${DEFAULT_FORMAT})`,
	)
	.option(
		'-k, --key <index>',
		`index of key column (defaults ${DEFAULT_KEY_INDEX})`,
	)
	.option(
		'-l, --lang <index>',
		`index of first language column (defaults ${DEFAULT_LANG_INDEX})`,
	)
	.option(
		'-o, --output <path>',
		`path of output directory (defaults to ${DEFAULT_OUTPUT_DIR})`,
	)
	.option(
		'-r, --range <range>',
		`range of data to parse (defaults ${DEFAULT_RANGE})`,
	)
	.option(
		'-s, --spreadsheet <id>',
		'id of spreadsheet to parse (required)',
	)
	.option(
		'-t, --token <path>',
		`path of credentials file (defaults to ${DEFAULT_TOKEN})`,
	)
	.parse(process.argv)

// Run script
generateFilesFromSpreadsheet(
	program.client || DEFAULT_CLIENT,
	program.token || DEFAULT_TOKEN,
	program.spreadsheet,
	program.range || DEFAULT_RANGE,
	program.key || DEFAULT_KEY_INDEX,
	program.lang || DEFAULT_LANG_INDEX,
	program.output || DEFAULT_OUTPUT_DIR,
	program.format || DEFAULT_FORMAT,
)
