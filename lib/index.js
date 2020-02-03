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
 * Format error message to display
 * @private
 *
 * @param {string} message - Custom message
 * @param {string} error - System error
 * @returns {string} Fromatted error message
 */
function formatErrorMessage(message, error) {
	return error ? `${message}:\n\t${error}` : message
}

/**
 * Generate, store and set new token for Google Sheets API
 * Based on: https://developers.google.com/sheets/api/quickstart/nodejs
 * TODO: Convert callbacks to promises
 * @private
 *
 * @param {OAuth2Client} auth - OAuth2Client instance to configure
 * @param {string} credentialsFile - Path of file to store token
 * @returns {Promise<string>} Generated token
 */
function getNewToken(auth, credentialsFile) {
	return new Promise((resolve, reject) => {
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
					reject(new Error(formatErrorMessage('Error getting token', err)))
					return
				}

				// Use token for client
				auth.setCredentials(token)

				// Store token to disk for later executions
				fs.writeFile(credentialsFile, JSON.stringify(token), err => {
					if (err) {
						reject(new Error(formatErrorMessage(`Error writing ${credentialsFile} file`, err)))
						return
					}

					console.log('Token stored to', credentialsFile)
					resolve(auth)
				})
			})
		})
	})
}

/**
 * Create and configure OAuth2Client instance for Google Sheets API
 * Based on: https://developers.google.com/sheets/api/quickstart/nodejs
 * @private
 *
 * @param {string} clientSecretFile - Path of file containing client secret data
 * @param {string} credentialsFile - Path of file containing credentials data
 * @returns {Promise<OAuth2Client>} Configured OAuth2Client instance
 */
async function getAuth(clientSecretFile, credentialsFile) {
	let clientSecretData
	let auth

	try {
		clientSecretData = fs.readFileSync(clientSecretFile)
	} catch (err) {
		throw new Error(formatErrorMessage(`Error reading ${clientSecretFile} file`, err))
	}

	try {
		const credentials = JSON.parse(clientSecretData)
		auth = new google.auth.OAuth2(
			credentials.installed.client_id,
			credentials.installed.client_secret,
			credentials.installed.redirect_uris[0],
		)

		// Check if already stored token
		const token = fs.readFileSync(credentialsFile)

		// Use token if exists
		auth.setCredentials(JSON.parse(token))

		return auth
	} catch (err) {
		// Create new token if does not exist
		return getNewToken(auth, credentialsFile)
	}

}

/**
 * Get rows data of spreadsheet using Google Sheets API
 * @private
 *
 * @param {OAuth2Client} auth - Configured OAuth2Client instance
 * @param {string} spreadsheetId - Id of spreadsheet to parse
 * @param {string} range - Range of cells to parse
 * @returns {Promise<Object[]>} Rows data of spreadsheet
 */
async function getSpreadsheetRows(auth, spreadsheetId, range) {
	try {
		const sheets = google.sheets({ version: 'v4', auth })
		const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range })

		return data.values
	} catch (err) {
		throw new Error(formatErrorMessage(`Error loading spreadsheet ${spreadsheetId} with range ${range}`, err))
	}
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
 * @param {number} beautify - Number of spaces to insert white space
 * @returns {Promise} No data
 */
async function generateFiles(rows, keyIndex, langIndex, outputDir, format, beautify) {
	if (rows.length === 0) {
		throw new Error(formatErrorMessage('No data found in spreadsheet'))
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
		console.info(`Creating ${outputDir} output directory`)

		try {
			fs.mkdirSync(outputDir)
			console.info(`${outputDir} has been created`)
		} catch (err) {
			throw new Error(formatErrorMessage(`Error creating directory ${outputDir}`, err))
		}
	}

	// Write file for each language
	// TODO: Use Promise.all?
	for (let i = langIndex; i < header.length; i++) {
		const formatConfig = FORMAT_CONFIG[format]
		const lang = header[i]
		const file = `${outputDir}/${lang}.${formatConfig.FILE_EXTENSION}`
		const data = `${formatConfig.DATA_PREFIX}${JSON.stringify(translations[lang], null, beautify)}${formatConfig.DATA_SUFFIX}`

		try {
			fs.writeFileSync(file, data)
			console.info(`${file} has been created`)
		} catch (err) {
			console.error(formatErrorMessage(`Error writing file ${file}`, err))
		}
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
 	 * @param {number} beautify - Number of spaces to insert white space
	 * @returns {Promise} No data
	 */
	async generateFilesFromSpreadsheet(
		clientSecretFile,
		credentialsFile,
		spreadsheetId,
		range,
		keyIndex,
		langIndex,
		outputDir,
		format,
		beautify,
	) {
		try {
			// TODO: Move to getSpreadsheetRows?
			if (!spreadsheetId) {
				throw new Error(formatErrorMessage('Spreadsheet ID is required'))
			}

			const auth = await getAuth(clientSecretFile, credentialsFile)
			const rows = await getSpreadsheetRows(auth, spreadsheetId, range)
			await generateFiles(rows, keyIndex, langIndex, outputDir, format, beautify)
		} catch (error) {
			console.error(error.message)
		}
	},
}
