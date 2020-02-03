#!/usr/bin/env node

'use strict'

const program = require('commander')
const { generateFilesFromSpreadsheet } = require('./lib')

// Used to get version number from package.json
require('pkginfo')(module, 'version')

// Default options values
const DEFAULT_BEAUTIFY = 0
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
		'-b, --beautify <number>', // TODO: Allow string to handle tabs?
		'number of spaces to insert white space in JSON/JS files (min: 0, max: 10)',
		DEFAULT_BEAUTIFY,
		parseInt,
	)
	.option(
		'-c, --client <path>',
		'path of client secret file',
		DEFAULT_CLIENT,
	)
	.option(
		'-f, --format <format>',
		'format of generated files (available values: "cjs", "esm", "json")',
		DEFAULT_FORMAT,
	)
	.option(
		'-k, --key <index>',
		'index of key column',
		DEFAULT_KEY_INDEX,
	)
	.option(
		'-l, --lang <index>',
		'index of first language column',
		DEFAULT_LANG_INDEX,
	)
	.option(
		'-o, --output <path>',
		'path of output directory',
		DEFAULT_OUTPUT_DIR,
	)
	.option(
		'-r, --range <range>',
		'range of data to parse',
		DEFAULT_RANGE,
	)
	.option(
		'-s, --spreadsheet <id>',
		'id of spreadsheet to parse (required)',
	)
	.option(
		'-t, --token <path>',
		'path of credentials file',
		DEFAULT_TOKEN,
	)
	.parse(process.argv)

// Run script
generateFilesFromSpreadsheet(
	program.client,
	program.token,
	program.spreadsheet,
	program.range,
	program.key,
	program.lang,
	program.output,
	program.format,
	program.beautify,
)
