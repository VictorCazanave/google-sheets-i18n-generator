'use strict';
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const dot = require('dot-object');

module.exports = {
	/**
	 * Generate, store and set new token for Spreadsheet API
	 * @param {oAuth2Client} auth - OAuth2Client instance to configure
	 * @param {String} credentialsFilename - Name of file to store token
	 * @param {Function} callback - Callback function called with configured auth
	 */
	getNewToken(auth, credentialsFilename, callback) {
		// Generate url to authorize i18n-generator
		const authUrl = auth.generateAuthUrl({
			access_type: 'offline',
			scope: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
		});

		console.log('Authorize i18n-generator by visiting this url:', authUrl);

		// Create interface to get code entered by user
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question('Enter the code from that page here: ', code => {
			rl.close();

			// Generate new token
			auth.getToken(code, (err, token) => {
				if (err) {
					console.error('Error getting token:', err);
				} else {
					// Use token for client
					auth.setCredentials(token);

					// Store token to disk for later executions
					fs.writeFile(credentialsFilename, JSON.stringify(token), err => {
						if (err) {
							console.error(`Error writing ${credentialsFilename} file:`, err);
						} else {
							console.log('Token stored to', credentialsFilename);
						}
					});

					callback(auth);
				}
			});
		});
	},

	/**
	 * Create and configure OAuth2Client instance for Spreadsheet API
	 * @param {String} clientSecretFilename - Name of file containing client secret data
	 * @param {String} credentialsFilename - Name of file containing credentials
	 * @param {Function} callback - Callback function called with created auth
	 */
	getAuth(clientSecretFilename, credentialsFilename, callback) {
		fs.readFile(clientSecretFilename, (err, data) => {
			if (err) {
				console.error(`Error reading ${clientSecretFilename} file:`, err);
			} else {
				const credentials = JSON.parse(data);
				const auth = new google.auth.OAuth2(
					credentials.installed.client_id,
					credentials.installed.client_secret,
					credentials.installed.redirect_uris[0]
				);

				// Check if already stored token
				fs.readFile(credentialsFilename, (err, token) => {
					if (err) {
						// Create new token if does not exist
						this.getNewToken(auth, credentialsFilename, callback);
					} else {
						// Use token if exists
						auth.setCredentials(JSON.parse(token));
						callback(auth);
					}
				});
			}
		});
	},

	/**
	 * Get rows data from Spreadsheet API
	 * @param {String} spreadsheetId - Id of the spreadsheet to parse
	 * @param {String} range - Range of cells to parse
	 * @param {String} clientSecretFilename - Name of file containing client secret data
	 * @param {String} credentialsFilename - Name of file containing credentials
	 * @param {Function} callback - Callback function called with rows data
	 */
	getSpreadsheetRows(spreadsheetId, range, clientSecretFilename, credentialsFilename, callback) {
		this.getAuth(clientSecretFilename, credentialsFilename, auth => {
			const sheets = google.sheets({ version: 'v4', auth });

			sheets.spreadsheets.values.get({ spreadsheetId, range }, (err, { data }) => {
				if (err) {
					console.log('Error loading spreadsheet:', err);
				} else {
					callback(data.values);
				}
			});
		});
	},

	/**
	 * Generate i18n files parsing rows data (from Excel or Spreadsheet)
	 * @param {Array} rows - List of rows
	 * @param {Number} langIndex - Index of first translation column
	 * @param {Number} keyIndex - Index of key column
	 * @param {String} outputDir - Path of output directory
	 * @param {Boolean} json - Indicate if generate JSON files instead of JS files
	 */
	generateFiles(rows, langIndex, keyIndex, outputDir, json) {
		// Use lower case to simplify user language checking in application (no need to worry about ENG/eng, en-US/en-us...)
		const firstRow = rows[0].map(lang => lang.toLowerCase());

		// Result object containing all translations
		let i18n = {};

		// Create sub-object for each language
		for (let i = langIndex; i < firstRow.length; i++) {
			const lang = firstRow[i];
			i18n[lang] = {};
		}

		// For each data row
		for (let i = 1; i < rows.length; i++) {
			const row = rows[i];
			const key = row[keyIndex];

			// Exclude question keys
			if (!key.includes('?')) {
				// For each language
				for (let i = langIndex; i < row.length; i++) {
					const lang = firstRow[i];
					const value = row[i];

					// Generate and add sub-object to i18n
					dot.str(key, value, i18n[lang]);
				}
			}
		}

		// Create output directory
		if (!fs.existsSync(outputDir)) {
			console.info('Creating output directory:', outputDir);
			fs.mkdirSync(outputDir);
		}

		// Write file for each language
		for (let i = langIndex; i < firstRow.length; i++) {
			const lang = firstRow[i];
			const ext = json ? 'json' : 'js';
			const file = `${outputDir}/${lang}.${ext}`;
			const data = json
				? JSON.stringify(i18n[lang])
				: `export default ${JSON.stringify(i18n[lang])};`;

			fs.writeFile(file, data, err => {
				if (err) {
					console.error(`Error writing file ${file}:`, err);
				} else {
					console.info(`${file} has been created`);
				}
			});
		}
	},

	/**
	 * Generate files parsing Google Spreadsheet
	 * @param {String} spreadsheetId - Id of the spreadsheet to parse
	 * @param {String} range - Range of cells to parse
	 * @param {String} clientSecretFilename - Name of file containing client secret data (generated by Google Developers Console)
	 * @param {String} credentialsFilename - Name of file containing credentials (token generated by Google API)
	 * @param {Number} langIndex - Index of first translation column
	 * @param {Number} keyIndex - Index of key column
	 * @param {String} outputDir - Path of output directory
	 * @param {Boolean} json - Indicate if generate JSON files instead of JS files
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
		this.getSpreadsheetRows(spreadsheetId, range, clientSecretFilename, credentialsFilename, rows =>
			this.generateFiles(rows, langIndex, keyIndex, outputDir, json)
		);
	},
};
