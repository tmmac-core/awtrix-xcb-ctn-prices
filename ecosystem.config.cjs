module.exports = {
  apps: [
    {
      name: 'ulanzi-tc001-prices',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '150M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
