/** PM2 process for the TEST environment only (test-avatar.academyskills.net). */
module.exports = {
  apps: [
    {
      name: "avatar-candidat",
      cwd: "/var/www/avatar-candidat/app",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3010",
        HOST: "127.0.0.1",
      },
      max_restarts: 10,
      min_uptime: "10s",
      time: true,
    },
  ],
};
