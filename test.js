const test = require('ava')
const sinon = require('sinon')
const fs = require('fs')
const mockFs = require('mock-fs')
const { google } = require('googleapis')
const { generateFilesFromSpreadsheet } = require('./lib')

// Arguments of generateFilesFromSpreadsheet
const spreadsheetId = 'spreadsheetId'
const clientSecretFile = 'client_secret.json'
const credentialsFile = 'credentials.json'
const range = 'range'
const keyIndex = 0
const langIndex = 1
const outputDir = 'output'
const format = 'json'

// Spy on console.error to test error message
// TODO: Use stub to avoid logs in terminal when running tests?
const consoleError = sinon.spy(console, 'error')
const consoleErrorMessage = () => consoleError.firstCall.args[0]

// Stub external libraries to test use cases
const googleSheets = sinon.stub(google, 'sheets')
const googleAuth = sinon.stub(google, 'auth')
const existsSync = sinon.stub(fs, 'existsSync')
const mkdirSync = sinon.stub(fs, 'mkdirSync')
const writeFileSync = sinon.stub(fs, 'writeFileSync')

// Mock Google credentials files with expected format to avoid error
function mockFiles() {
	mockFs({
		[clientSecretFile]: JSON.stringify({
			installed: {
				client_id: 'client_id',
				client_secret: 'client_secret',
				redirect_uris: ['uri'],
			},
		}),
		[credentialsFile]: JSON.stringify({ token: 'token' }),
	})
}

// Mock Google auth module with expected format to avoid error
function mockGoogleAuth() {
	googleAuth.returns({
		OAuth2() {
			return {
				setCredentials() { },
			}
		},
	})
}

// Mock Google sheets module with expected format to avoid error
function mockSpreadsheetValues(values) {
	googleSheets.returns({
		spreadsheets: {
			values,
		},
	})
}

// Reset/restore all spies/stubs/mocks
test.afterEach(() => {
	consoleError.resetHistory()
	sinon.reset()
	mockFs.restore()
})

// Must use serial to avoid to mess up stubs
// https://stackoverflow.com/a/37900956/9826498
// TODO: Add tests when no error
test.serial('displays error when spreadsheet ID is not provided', async t => {
	await generateFilesFromSpreadsheet()

	t.is(
		consoleErrorMessage(),
		'Spreadsheet ID is required',
	)
})

test.serial('displays error when client secret file does not exist', async t => {
	mockFs({})

	await generateFilesFromSpreadsheet(
		spreadsheetId,
		clientSecretFile,
		credentialsFile,
		range,
	)

	t.is(
		consoleErrorMessage(),
		`Error reading client_secret.json file:\n\tError: ENOENT: no such file or directory, open 'client_secret.json'`,
	)
})

test.serial('displays error when spreadsheet is not accessible', async t => {
	mockFiles()
	mockGoogleAuth()
	mockSpreadsheetValues({
		get() {
			throw new Error('mocked error')
		},
	})

	await generateFilesFromSpreadsheet(
		spreadsheetId,
		clientSecretFile,
		credentialsFile,
		range,
	)

	t.is(
		consoleErrorMessage(),
		'Error loading spreadsheet spreadsheetId with range range:\n\tError: mocked error',
	)
})

test.serial('displays error when spreadsheet is empty', async t => {
	mockFiles()
	mockGoogleAuth()
	mockSpreadsheetValues({
		get() {
			return {
				data: {
					values: [],
				},
			}
		},
	})

	await generateFilesFromSpreadsheet(
		spreadsheetId,
		clientSecretFile,
		credentialsFile,
		range,
	)

	t.is(
		consoleErrorMessage(),
		'No data found in spreadsheet',
	)
})

test.serial('displays error when output directory cannot be created', async t => {
	mockFiles()
	mockGoogleAuth()
	mockSpreadsheetValues({
		get() {
			return {
				data: {
					values: [[]],
				},
			}
		},
	})
	existsSync.returns(false)
	mkdirSync.throws(new Error('mocked error'))

	await generateFilesFromSpreadsheet(
		spreadsheetId,
		clientSecretFile,
		credentialsFile,
		range,
		keyIndex,
		langIndex,
		outputDir,
		format,
	)

	t.is(
		consoleErrorMessage(),
		'Error creating directory output:\n\tError: mocked error',
	)
})

test.serial('displays error when a file cannot be created', async t => {
	mockFiles()
	mockGoogleAuth()
	mockSpreadsheetValues({
		get() {
			return {
				data: {
					values: [
						[
							'key',
							'en',
						],
						[
							'yes',
							'Yes',
						],
					],
				},
			}
		},
	})
	existsSync.returns(true)
	writeFileSync.throws(new Error('mocked error'))

	await generateFilesFromSpreadsheet(
		spreadsheetId,
		clientSecretFile,
		credentialsFile,
		range,
		keyIndex,
		langIndex,
		outputDir,
		format,
	)

	t.is(
		consoleErrorMessage(),
		'Error writing file output/en.json:\n\tError: mocked error',
	)
})

