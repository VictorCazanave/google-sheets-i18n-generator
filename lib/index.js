'use strict'

const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')
const dot = require('dot-object')

const FORMAT_CONFIG = {
	cjs: {
		FILE_EXTENSION: 'js',
		DATA_PREFIX: 'module.exports = ',
		DATA_SUFFIX: ';',
	},
	esm: {
		FILE_EXTENSION: 'js',
		DATA_PREFIX: 'export default ',
		DATA_SUFFIX: ';',
	},
	json: {
		FILE_EXTENSION: 'json',
		DATA_PREFIX: '',
		DATA_SUFFIX: '',
	},
}

/**
 * Generate, store and set new token for Google Sheets API
 * Based on: https://developers.google.com/sheets/api/quickstart/nodejs
 * @private
 *
 * @param {OAuth2Client} auth - OAuth2Client instance to configure
 * @param {string} credentialsFile - Path of file to store token
 * @param {Function} callback - Callback function called with configured auth
 */
function getNewToken(auth, credentialsFile, callback) {
	// Generate url to authorize google-sheets-i18n
	const authUrl = auth.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
	})

	console.log('Authorize this app by visiting this url:', authUrl)

	// Create interface to get code entered by user
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	rl.question('Enter the code from that page here: ', code => {
		rl.close()

		// Generate new token
		auth.getToken(code, (err, token) => {
			if (err) {
				console.error('Error getting token:', err)
				return
			}

			// Use token for client
			auth.setCredentials(token)

			// Store token to disk for later executions
			fs.writeFile(credentialsFile, JSON.stringify(token), err => {
				if (err) {
					console.error(`Error writing ${credentialsFile} file:`, err)
					return
				}

				console.log('Token stored to', credentialsFile)
			})

			callback(auth)
		})
	})
}

/**
 * Create and configure OAuth2Client instance for Google Sheets API
 * Based on: https://developers.google.com/sheets/api/quickstart/nodejs
 * @private
 *
 * @param {string} clientSecretFile - Path of file containing client secret data
 * @param {string} credentialsFile - Path of file containing credentials
 * @param {Function} callback - Callback function called with created auth
 */
function getAuth(clientSecretFile, credentialsFile, callback) {
	fs.readFile(clientSecretFile, (err, data) => {
		if (err) {
			console.error(`Error reading ${clientSecretFile} file:`, err)
			return
		}

		const credentials = JSON.parse(data)
		const auth = new google.auth.OAuth2(
			credentials.installed.client_id,
			credentials.installed.client_secret,
			credentials.installed.redirect_uris[0]
		)

		// Check if already stored token
		fs.readFile(credentialsFile, (err, token) => {
			if (err) {
				// Create new token if does not exist
				getNewToken(auth, credentialsFile, callback)
				return
			}

			// Use token if exists
			auth.setCredentials(JSON.parse(token))
			callback(auth)
		})
	})
}

/**
 * Get rows data of spreadsheet using Google Sheets API
 * @private
 *
 * @param {string} clientSecretFile - Path of file containing client secret data
 * @param {string} credentialsFile - Path of file containing credentials
 * @param {string} spreadsheetId - Id of spreadsheet to parse
 * @param {string} range - Range of cells to parse
 * @param {Function} callback - Callback function called with rows data
 */
function getSpreadsheetRows(clientSecretFile, credentialsFile, spreadsheetId, range, callback) {
	getAuth(clientSecretFile, credentialsFile, auth => {
		const sheets = google.sheets({ version: 'v4', auth })

		sheets.spreadsheets.values.get({ spreadsheetId, range }, (err, { data }) => {
			if (err) {
				console.log('Error loading spreadsheet:', err)
				return
			}

			callback(data.values)
		})
	})
}

/**
 * Generate i18n files parsing rows data of spreadsheet
 * @private
 *
 * @param {Object[]} rows - List of rows
 * @param {number} keyIndex - Index of key column
 * @param {number} langIndex - Index of first language column
 * @param {string} outputDir - Path of output directory
 * @param {string} format - Format of generated files
 */
function generateFiles(rows, keyIndex, langIndex, outputDir, format) {
	if (rows.length === 0) {
		console.error('No data found in spreadsheet')
		return
	}

	const header = rows[0]
	let translations = {} // Result object containing all translations

	// Create sub-object for each language
	for (let i = langIndex; i < header.length; i++) {
		const lang = header[i]
		translations[lang] = {}
	}

	// For each data row
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i]
		const key = row[keyIndex]

		// For each language
		for (let j = langIndex; j < row.length; j++) {
			const lang = header[j]
			const value = row[j]

			// Generate and add sub-object to translations
			dot.str(key, value, translations[lang])
		}
	}

	// Create output directory
	if (!fs.existsSync(outputDir)) {
		console.info('Creating output directory:', outputDir)
		fs.mkdirSync(outputDir)
	}

	// Write file for each language
	for (let i = langIndex; i < header.length; i++) {
		const formatConfig = FORMAT_CONFIG[format]
		const lang = header[i]
		const file = `${outputDir}/${lang}.${formatConfig.FILE_EXTENSION}`
		const data = `${formatConfig.DATA_PREFIX}${JSON.stringify(translations[lang])}${formatConfig.DATA_SUFFIX}`

		fs.writeFile(file, data, err => {
			if (err) {
				console.error(`Error writing file ${file}:`, err)
				return
			}

			console.info(`${file} has been created`)
		})
	}
}

module.exports = {
	/**
	 * Generate files parsing Google Sheets spreadsheet
	 *
	 * @param {string} clientSecretFile - Path of file containing client secret data (generated by Google Developers Console)
	 * @param {string} credentialsFile - Path of file containing credentials (token generated by Google API)
	 * @param {string} spreadsheetId - Id of spreadsheet to parse
	 * @param {string} range - Range of cells to parse
	 * @param {number} keyIndex - Index of key column
	 * @param {number} langIndex - Index of first language column
	 * @param {string} outputDir - Path of output directory
	 * @param {string} format - Format of generated files
	 */
	generateFilesFromSpreadsheet(
		clientSecretFile,
		credentialsFile,
		spreadsheetId,
		range,
		keyIndex,
		langIndex,
		outputDir,
		format
	) {
		getSpreadsheetRows(clientSecretFile, credentialsFile, spreadsheetId, range, rows =>
			generateFiles(rows, keyIndex, langIndex, outputDir, format)
		)
	},
}
