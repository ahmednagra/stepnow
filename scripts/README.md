# StepNow Operational Scripts

Scripts deployed to the production host for operational tasks (backups, deploys, seed data, etc.).

## Status

Not yet written. Scripts referenced in `docs/architecture/backend.md`:

- `backup_db.sh` — daily `pg_dump` to S3-compatible storage (called via OS cron)
- `seed_admin.py` — seeds the initial admin user from the FastAPI app
- `deploy.sh` — deployment script for the monorepo

These will be added as their corresponding features are built.
