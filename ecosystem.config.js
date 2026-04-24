const { exec } = require('child_process');
module.exports = {
  apps: [{
    name: 'fxisv-web',
    script: 'node_modules/.bin/next',
    args: 'start -p 3004',
    cwd: '/www/wwwroot/fxisv.com',
    env: {
      NODE_ENV: 'production',
      PORT: '3004',
      NEXT_PUBLIC_API_URL: 'http://localhost:3005/api'
    },
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
