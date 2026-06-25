module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        // Keep ESM syntax intact so Jest (with experimental VM modules) can load modules as ESM
        modules: false,
      },
    ],
  ],
  plugins: ['@babel/plugin-syntax-import-meta'],
  sourceType: 'unambiguous',
};
