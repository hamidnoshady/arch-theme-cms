# Graphite WordPress

Run `docker compose -f wordpress/docker-compose.yml up -d`, then install WordPress at `http://localhost:8080`. Activate **Graphite Core** before the **Graphite** theme. The plugin owns content and settings; the theme owns presentation. This directory never writes to eShobe.

Run `powershell -NoProfile -ExecutionPolicy Bypass -File wordpress/tests/smoke.ps1 all` for structural checks.
