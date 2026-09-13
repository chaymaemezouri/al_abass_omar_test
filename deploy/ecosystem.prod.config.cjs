/** PM2 — PRODUCTION al-abass-omar.academyskills.net (port 3011). */
module.exports = {
  apps: [
    {
      name: "al-abass-omar",
      cwd: "/var/www/al-abass-omar/app",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3011",
        HOST: "127.0.0.1",
      },
      max_restarts: 10,
      min_uptime: "10s",
      time: true,
    },
  ],
};
