module.exports = {
  apps: [
    {
      name: 'dtamtech-md',
      script: 'index.js',
      node_args: '--max-old-space-size=512 --optimize-for-size --expose-gc',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './temp/logs/pm2-error.log',
      out_file: './temp/logs/pm2-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
