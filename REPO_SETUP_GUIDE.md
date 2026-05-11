# StepNow Monorepo — Repository Setup Guide

A one-time guide to take the prepared files and initialize them as a working Git repository connected to GitHub.

---

## Step 1 — Settings on the GitHub "Create a new repository" page

Before clicking "Create repository", verify these settings:

| Field | Choice | Reason |
|---|---|---|
| Owner | `ahmednagra` | Your account |
| Repository name | `stepnow` | Matches the monorepo name |
| Description | `Bilingual marketing and booking site for StepNow Rides & Movers — German Mietwagen operator.` | Concise, professional |
| **Visibility** | ⚠️ **Private** | Contains business data, internal architecture notes, risk acknowledgements |
| Add README | **Off** | We have a custom README to push |
| Add .gitignore | **No .gitignore** | We have a custom one to push |
| Add license | **No license** | Proprietary — `NOTICE.md` documents this instead |

Then click **Create repository**.

---

## Step 2 — Prepare the files on your machine

You have two options for getting the prepared files onto your machine.

### Option A — Download the tarball (fastest)

Download `stepnow-monorepo-initial.tar.gz` and extract it:

```bash
# Create a parent directory wherever you keep code
mkdir -p ~/code
cd ~/code

# Move the downloaded tarball here, then extract
mv ~/Downloads/stepnow-monorepo-initial.tar.gz .
mkdir stepnow
cd stepnow
tar -xzf ../stepnow-monorepo-initial.tar.gz
rm ../stepnow-monorepo-initial.tar.gz

# Verify structure
ls -la
```

You should see:
```
.gitignore
NOTICE.md
README.md
apps/
docs/
infra/
scripts/
```

### Option B — Download files individually

Download each file from the outputs panel and place them into a folder structure matching what's in the repo. Slower but works if the tarball isn't convenient.

---

## Step 3 — Initialize Git and push to GitHub

From inside the `stepnow/` directory:

```bash
# Initialize Git
git init

# Set your identity (only needed once globally; skip if already configured)
git config user.name "Ahmed Nagra"
git config user.email "your.email@example.com"   # use the email tied to your GitHub account

# Default branch should be `main` (not `master`)
git branch -M main

# Stage everything
git add .

# Verify what's being committed (no .env files, no node_modules, etc.)
git status

# First commit
git commit -m "Initial commit: monorepo scaffolding and architecture documentation

- Monorepo structure: apps/{backend,frontend}, docs, scripts, infra
- Documentation: backend + frontend architecture (all-DB content model),
  website outline, design direction, triage checklist
- Legal page drafts in docs/legal/
- .gitignore covering Python + Node.js + secrets
- Proprietary notice in NOTICE.md"

# Add the GitHub remote (replace with the URL from the GitHub page after creating the repo)
git remote add origin git@github.com:ahmednagra/stepnow.git
# Or if you use HTTPS:
# git remote add origin https://github.com/ahmednagra/stepnow.git

# Push
git push -u origin main
```

After the push, refresh the GitHub repo page. You should see:
- README rendered on the front page
- `apps/`, `docs/`, `infra/`, `scripts/` folders visible
- `NOTICE.md` and `.gitignore` in the root

---

## Step 4 — Verify the repo on GitHub

Click around to verify everything is in place:

- [ ] README displays the project overview correctly
- [ ] `docs/INDEX.md` is readable from `docs/`
- [ ] `docs/architecture/backend.md` opens and renders properly
- [ ] `docs/architecture/frontend.md` opens and renders properly
- [ ] `docs/legal/` contains the three German/English legal drafts
- [ ] `docs/archive/rebuild-plan-v1.md` exists (the superseded plan)
- [ ] `apps/backend/README.md` and `apps/frontend/README.md` are present as placeholders
- [ ] No `.env` files anywhere
- [ ] No `node_modules/`, `__pycache__/`, or `.venv/` directories anywhere
- [ ] Repository is marked **Private** in the repo settings

If anything is wrong, you can fix it locally and push again — it's still day 1.

---

## Step 5 — Set up branch protection (recommended)

Once you have code landing, you'll want some basic protection on `main`:

1. Go to **Settings → Branches** in your repo
2. Click **Add branch ruleset** (or "Add classic branch protection rule" — either works for a solo project)
3. Apply to branch `main`
4. Enable:
   - Require a pull request before merging — even solo, this gives you a chance to review your own changes
   - Require linear history (no merge commits) — keeps the history clean

For a solo project, that's enough. You don't need required reviewers, status checks, or signed commits at this stage.

---

## Step 6 — Set up SSH key (if you don't have one)

If `git push` asks for a password or fails with permission denied:

```bash
# Generate a key
ssh-keygen -t ed25519 -C "your.email@example.com"
# Accept defaults, optionally set a passphrase

# Copy the public key to clipboard (macOS)
pbcopy < ~/.ssh/id_ed25519.pub
# Linux: cat ~/.ssh/id_ed25519.pub  (then copy manually)
# Windows: type %userprofile%\.ssh\id_ed25519.pub  (then copy manually)

# Add the key to GitHub:
# Settings → SSH and GPG keys → New SSH key → paste → save
```

Then test:
```bash
ssh -T git@github.com
# Should respond: "Hi ahmednagra! You've successfully authenticated..."
```

Now retry the `git push -u origin main` command.

---

## Step 7 — Pin the next action

The repo exists. Documentation is in place. Nothing has been built yet.

The natural next move is **Phase B from the project plan**:

- **Triage the live step-now.de site first** (1-2 hours): deploy Impressum draft, deploy Datenschutz draft, fix the worst content issues. Independent of the rebuild — stops the bleeding on production.
- Then, **initialize the backend** (`apps/backend/`) per `docs/architecture/backend.md` §5 (Repository Layout): `main.py`, `config/settings.py`, `requirements.txt`, then the auth scaffold.

After the backend foundation, the frontend can be bootstrapped against it.

Both paths are documented end-to-end in the architecture docs. There's no further planning needed.

---

## What's NOT in the repo yet

For clarity — these are intentionally missing and will be added as work begins:

- `apps/backend/main.py` and the FastAPI scaffold
- `apps/frontend/package.json` and the Next.js scaffold
- `scripts/backup_db.sh` and `scripts/seed_admin.py`
- `infra/nginx.conf` and the systemd unit files
- `.env.example` files in `apps/backend/` and `apps/frontend/` (created when the apps are scaffolded)
- `docs/runbooks/restore-db.md` and `docs/runbooks/deploy.md` (added when the deploy pipeline exists)

These are the next deliverables, in roughly the order they'll be built.
