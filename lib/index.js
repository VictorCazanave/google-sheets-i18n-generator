'use strict'

const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')
const dot = require('dot-object')

/**
 * Generate, store and set new token for Google Sheets API
 * Based on: https://developers.google.com/sheets/api/quickstart/nodejs
 * @private
 *
 * @param {OAuth2Client} auth - OAuth2Client instance to configure
 * @param {string} credentialsFilename - Name of file to store token
 * @param {Function} callback - Callback function called with configured auth
 */
function getNewToken(auth, credentialsFilename, callback) {
	// Generate url to authorize google-sheets-i18n
	const authUrl = auth.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
	})

	console.log('Authorize i18n-generator by visiting this url:', authUrl)

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
			} else {
				// Use token for client
				auth.setCredentials(token)

				// Store token to disk for later executions
				fs.writeFile(credentialsFilename, JSON.stringify(token), err => {
					if (err) {
						console.error(`Error writing ${credentialsFilename} file:`, err)
					} else {
						console.log('Token stored to', credentialsFilename)
					}
				})

				callback(auth)
			}
		})
	})
}

/**
 * Create and configure OAuth2Client instance for Google Sheets API
 * Based on: https://developers.google.com/sheets/api/quickstart/nodejs
 * @private
 *
 * @param {string} clientSecretFilename - Name of file containing client secret data
 * @param {string} credentialsFilename - Name of file containing credentials
 * @param {Function} callback - Callback function called with created auth
 */
function getAuth(clientSecretFilename, credentialsFilename, callback) {
	fs.readFile(clientSecretFilename, (err, data) => {
		if (err) {
			console.error(`Error reading ${clientSecretFilename} file:`, err)
		} else {
			const credentials = JSON.parse(data)
			const auth = new google.auth.OAuth2(
				credentials.installed.client_id,
				credentials.installed.client_secret,
				credentials.installed.redirect_uris[0]
			)

			// Check if already stored token
			fs.readFile(credentialsFilename, (err, token) => {
				if (err) {
					// Create new token if does not exist
					getNewToken(auth, credentialsFilename, callback)
				} else {
					// Use token if exists
					auth.setCredentials(JSON.parse(token))
					callback(auth)
				}
			})
		}
	})
}

/**
 * Get rows data of spreadsheet using Google Sheets API
 * @private
 *
 * @param {string} spreadsheetId - Id of spreadsheet to parse
 * @param {string} range - Range of cells to parse
 * @param {string} clientSecretFilename - Name of file containing client secret data
 * @param {string} credentialsFilename - Name of file containing credentials
 * @param {Function} callback - Callback function called with rows data
 */
function getSpreadsheetRows(spreadsheetId, range, clientSecretFilename, credentialsFilename, callback) {
	getAuth(clientSecretFilename, credentialsFilename, auth => {
		const sheets = google.sheets({ version: 'v4', auth })

		sheets.spreadsheets.values.get({ spreadsheetId, range }, (err, { data }) => {
			if (err) {
				console.log('Error loading spreadsheet:', err)
			} else {
				callback(data.values)
			}
		})
	})
}

/**
 * Generate i18n files parsing rows data of spreadsheet
 * @private
 *
 * @param {Object[]} rows - List of rows
 * @param {number} langIndex - Index of first translation column
 * @param {number} keyIndex - Index of key column
 * @param {string} outputDir - Path of output directory
 * @param {boolean} json - Indicate if generate JSON files instead of JS files
 */
function generateFiles(rows, langIndex, keyIndex, outputDir, json) {
	// Use lower case to simplify user language checking in application (no need to worry about ENG/eng, en-US/en-us...)
	const firstRow = rows[0].map(lang => lang.toLowerCase())

	// Result object containing all translations
	let i18n = {}

	// Create sub-object for each language
	for (let i = langIndex; i < firstRow.length; i++) {
		const lang = firstRow[i]
		i18n[lang] = {}
	}

	// For each data row
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i]
		const key = row[keyIndex]

		// Exclude question keys
		if (!key.includes('?')) {
			// For each language
			for (let i = langIndex; i < row.length; i++) {
				const lang = firstRow[i]
				const value = row[i]

				// Generate and add sub-object to i18n
				dot.str(key, value, i18n[lang])
			}
		}
	}

	// Create output directory
	if (!fs.existsSync(outputDir)) {
		console.info('Creating output directory:', outputDir)
		fs.mkdirSync(outputDir)
	}

	// Write file for each language
	for (let i = langIndex; i < firstRow.length; i++) {
		const lang = firstRow[i]
		const ext = json ? 'json' : 'js'
		const file = `${outputDir}/${lang}.${ext}`
		const data = json
			? JSON.stringify(i18n[lang])
			: `export default ${JSON.stringify(i18n[lang])};`

		fs.writeFile(file, data, err => {
			if (err) {
				console.error(`Error writing file ${file}:`, err)
			} else {
				console.info(`${file} has been created`)
			}
		})
	}
}

module.exports = {
	/**
	 * Generate files parsing Google Spreadsheet
	 *
	 * @param {string} spreadsheetId - Id of spreadsheet to parse
	 * @param {string} range - Range of cells to parse
	 * @param {string} clientSecretFilename - Name of file containing client secret data (generated by Google Developers Console)
	 * @param {string} credentialsFilename - Name of file containing credentials (token generated by Google API)
	 * @param {number} langIndex - Index of first translation column
	 * @param {number} keyIndex - Index of key column
	 * @param {string} outputDir - Path of output directory
	 * @param {boolean} json - Indicate if generate JSON files instead of JS files
	 */
	generateFilesFromSpreadsheet(
		spreadsheetId,
		range,
		clientSecretFilename,
		credentialsFilename,
		langIndex,
		keyIndex,
		outputDir,
		json
	) {
		getSpreadsheetRows(spreadsheetId, range, clientSecretFilename, credentialsFilename, rows =>
			generateFiles(rows, langIndex, keyIndex, outputDir, json)
		)
	},
}
