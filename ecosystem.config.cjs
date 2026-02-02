module.exports = {
  apps: [
    {
      name: "admin",
      script: "serve",
      cwd: "/var/www/debarras/admin", // change to your DEPLOY_PATH

      env: {
        NODE_ENV: "production",
        PM2_SERVE_PATH: "dist",
        PM2_SERVE_PORT: 8000,
        PM2_SERVE_SPA: "true",
        PM2_SERVE_HOMEPAGE: "/index.html",
      },

      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",

      out_file: "/var/www/debarras/admin/logs/admin-out.log",
      error_file: "/var/www/debarras/admin/logs/admin-error.log",
      merge_logs: true,
    },
  ],
};
