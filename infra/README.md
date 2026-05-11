# StepNow Infrastructure

nginx configuration, systemd unit files, and Docker Compose for local development.

## Status

Not yet written. Will include:

- `nginx.conf` — reverse proxy routing `/api/v0/*` to FastAPI, everything else to Next.js
- `docker-compose.yml` — local Postgres + optional services for dev
- `systemd/stepnow-backend.service` — production systemd unit for FastAPI
- `systemd/stepnow-frontend.service` — production systemd unit for Next.js

See `docs/architecture/backend.md` §3 (Deployment Topology) for the target architecture.
