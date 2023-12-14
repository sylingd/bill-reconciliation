module.exports = {
  root: true,
  extends: ['@modern-js'],
  overrides: [
    {
      files: ['*.ts', '*.d.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/prefer-for-of': 'off'
      }
    }
  ]
};
