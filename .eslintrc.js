module.exports = {
	root: true,
	env: {
		node: true,
		es6: true
	},
	parserOptions: {
		ecmaVersion: 2017
	},
	extends: ['eslint:recommended'],
	rules: {
		'no-console': 'off',
		'indent': ['error', 'tab'],
		'no-tabs': 'off',
		'semi': ["error", "never"],
		'comma-dangle': ['error', 'always-multiline'],
	}
}
