import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: {
      prettier: eslintPluginPrettier
    },
    rules: {
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'error'
    }
  }
]
