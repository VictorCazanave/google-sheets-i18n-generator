module.exports = {
	root: true,
	env: {
		node: true,
		es6: true
	},
	extends: ['eslint:recommended'],
	rules: {
		'no-console': 'off',
		'indent': ['error', 'tab'],
    'no-tabs': 'off',
    'comma-dangle': ['error', 'always-multiline'],
	}
}
