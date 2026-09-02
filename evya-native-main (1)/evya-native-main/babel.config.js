module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // PERF-7: strip console.* in release only; keep error/warn for production diagnostics
  env: {
    production: {
      plugins: [
        ['transform-remove-console', { exclude: ['error', 'warn'] }],
      ],
    },
  },
};
