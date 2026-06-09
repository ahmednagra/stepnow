# Email Subsystem — End-to-End Testing Guide

> **Purpose:** Verify the email subsystem is wired correctly after applying
> all phases. Run through this once after the merge to catch any
> environment-specific issues.

---

## Prerequisites

- [ ] All Phase 1–4 files placed at the correct paths
- [ ] All Phase 5 patches applied (`AuthService.py`, `EmailVerificationService.py`, `app/Models/__init__.py`, `config/settings.py`, `requirements.txt`)
- [ ] `FRONTEND_URL` duplicate in `settings.py` removed (single declaration only)
- [ ] PostgreSQL is running with the project's DB
- [ ] You have access to a Gmail account dedicated to dev (recommended) OR a real Gmail account where you don't mind seeing test emails

---

## Step 1 — Install New Dependencies

```bash
cd /path/to/your/backend
pip install -r requirements.txt
```

**Expected:** `aiosmtplib`, `Jinja2`, `email-validator`, `sendgrid`, `boto3` install without errors.

**Verify:**
```bash
python -c "import aiosmtplib, jinja2, sendgrid, boto3; print('All imports OK')"
```

---

## Step 2 — Generate Gmail App Password

1. Open the Gmail account in a browser.
2. Visit https://myaccount.google.com/security
3. Enable **2-Step Verification** if not already enabled.
4. Visit https://myaccount.google.com/apppasswords
5. Choose: **App = Mail**, **Device = Other** → name it `Echooo Backend Dev`.
6. Copy the 16-character password (looks like `abcd efgh ijkl mnop`).

**⚠️ Important:** This password is shown ONCE. Save it immediately to your password manager.

---

## Step 3 — Configure `.env`

Add to your `.env` file (replacing placeholders with real values):

```bash
# Email — frontend link base
FRONTEND_URL=http://localhost:3000

# Email — Gmail SMTP (active provider)
EMAIL_PROVIDER=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_TLS=True
SMTP_USER=youraccount@gmail.com
SMTP_PASSWORD=abcdefghijklmnop          # 16-char App Password, no spaces
EMAILS_FROM_EMAIL=youraccount@gmail.com  # MUST match SMTP_USER for Gmail
EMAILS_FROM_NAME=Echooo Team

# Optional
EMAILS_REPLY_TO=
SMTP_TIMEOUT_SECONDS=30
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_BACKOFF_SECONDS=2
```

---

## Step 4 — Verify Configuration Loads

```bash
python -c "
from config.email import email_settings, EmailProvider
print('Primary provider:', email_settings.primary_provider.value)
print('From email:      ', email_settings.from_email)
print('SMTP user set:   ', bool(email_settings.smtp_user))
print('SMTP pass set:   ', bool(email_settings.smtp_password))
print('Frontend URL:    ', email_settings.frontend_url)
"
```

**Expected output:**
```
Primary provider: gmail
From email:       youraccount@gmail.com
SMTP user set:    True
SMTP pass set:    True
Frontend URL:     http://localhost:3000
```

---

## Step 5 — Verify Provider Registry

```bash
python -c "
from app.Services.Notifications.Email.Providers.ProviderFactory import provider_factory
status = provider_factory.list_configured()
for name, configured in status.items():
    print(f'{name.value:10s}  configured={configured}')
"
```

**Expected output:**
```
gmail       configured=True
sendgrid    configured=False
twilio      configured=False
ses         configured=False
```

If `gmail` shows `False`, recheck `SMTP_USER` / `SMTP_PASSWORD` / `EMAILS_FROM_EMAIL` in `.env`.

---

## Step 6 — Verify Templates Load

```bash
python -c "
from app.Services.Notifications.Email.TemplateRenderer import template_renderer
for tpl in ['auth/verification', 'auth/welcome', 'auth/password_reset']:
    html_ok = template_renderer.template_exists(tpl, 'html')
    txt_ok  = template_renderer.template_exists(tpl, 'txt')
    print(f'{tpl:30s}  html={html_ok}  txt={txt_ok}')
"
```

**Expected output (all True):**
```
auth/verification             html=True  txt=True
auth/welcome                  html=True  txt=True
auth/password_reset           html=True  txt=True
```

---

## Step 7 — Verify `email_logs` Table Exists

After the app starts (auto-migration runs):

```sql
\d email_logs
```

**Expected:** Table with columns `id`, `user_id`, `to_email`, `template_name`, `subject`, `provider`, `status`, `provider_message_id`, `error_code`, `error_message`, `attempts`, `extra`, `sent_at`, `created_at`, `updated_at`.

If the table doesn't exist, check `app/Models/__init__.py` includes `from app.Models.email_log import EmailLog` and restart the app.

---

## Step 8 — Smoke Test: Direct Send

Before testing the full flow, send a one-off email to confirm Gmail SMTP works:

```bash
python -c "
import asyncio
from config.database import SessionLocal
from app.Services.Notifications.Email import EmailService

async def main():
    db = SessionLocal()
    try:
        result = await EmailService.send_template(
            to='your-personal-email@example.com',  # ← change to your real inbox
            template='auth/verification',
            subject='Echooo email subsystem smoke test',
            context={
                'user_name': 'Test User',
                'verification_link': 'http://localhost:3000/verify-email?token=abc123',
            },
            db=db,
        )
        print('success:', result.success)
        print('provider:', result.provider.value)
        print('message_id:', result.provider_message_id)
        print('error:', result.error_message)
    finally:
        db.close()

asyncio.run(main())
"
```

**Expected:**
- Output shows `success: True`
- Email arrives in your inbox within ~30 seconds (check spam folder if missing)
- `email_logs` has one new row with `status='sent'`

**If it fails:**
- `SMTPAuthenticationError` → App Password is wrong, regenerate it
- `Connection refused` → check `SMTP_HOST` / `SMTP_PORT`
- `Sender refused` → `SMTP_USER` and `EMAILS_FROM_EMAIL` must match for Gmail

---

## Step 9 — End-to-End: Register a B2C User

Start your API server, then:

```bash
curl -X POST http://localhost:8000/api/v0/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-personal-email@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "full_name": "Test User",
    "phone_number": "+1234567890",
    "user_type": "b2c",
    "company_name": "Test Company"
  }'
```

**Expected:**
- HTTP 200 with the user object
- Within ~10 seconds, a verification email arrives in `your-personal-email@example.com`
- Server logs show:
  ```
  Service: Verification token created - your-personal-email@example.com: <token>
  Service: Verification email sent - your-personal-email@example.com via gmail (attempts=1)
  ```
- `email_logs` has a new row:
  ```sql
  SELECT to_email, template_name, status, provider, sent_at
  FROM email_logs
  ORDER BY created_at DESC
  LIMIT 1;
  ```

---

## Step 10 — End-to-End: Verify Email & Receive Welcome

Click the link in the verification email (or copy the token and call):

```bash
curl -X POST http://localhost:8000/api/v0/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"<paste-token-from-email>"}'
```

**Expected:**
- HTTP 200 with `{"message": "Email verified successfully", ...}`
- A **welcome email** arrives in your inbox within ~10 seconds
- Server logs show:
  ```
  Service: Welcome email sent - your-personal-email@example.com via gmail
  ```
- `email_logs` has TWO rows for this user:
  ```sql
  SELECT to_email, template_name, status, sent_at
  FROM email_logs
  WHERE user_id = '<user-uuid>'
  ORDER BY created_at;
  ```

  Should show:
  ```
  to_email                    | template_name      | status | sent_at
  ----------------------------+--------------------+--------+-----------
  your-personal-email@...     | auth/verification  | sent   | <ts>
  your-personal-email@...     | auth/welcome       | sent   | <ts>
  ```

---

## Step 11 — End-to-End: Resend Verification

Register another user without verifying, then test resend:

```bash
curl -X POST http://localhost:8000/api/v0/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-personal-email@example.com"}'
```

**Expected:**
- HTTP 200
- A fresh verification email arrives
- `email_logs` has a new row with the new token's link

---

## Step 12 — Negative Test: Bad SMTP Password

Temporarily set `SMTP_PASSWORD=wrong-password` in `.env`, restart app, try register again.

**Expected:**
- Registration HTTP request still returns 200 (registration must not fail when email fails)
- Server logs show:
  ```
  Service: Verification email FAILED - <email> via gmail: SMTP authentication failed
  ```
- `email_logs` row has `status='failed'`, `error_code='permanent'`, `error_message` filled in
- Restore the correct password and test again

This confirms our **non-blocking design**: email outages cannot break registration.

---

## Visual Inspection

Open the verification email in **at least three clients** to check rendering:

- [ ] **Gmail web** (default client)
- [ ] **Gmail mobile app** (iOS or Android)
- [ ] **Apple Mail** or **Outlook** (any version)

Look for:
- Header gradient renders (purple/violet for verification, green for welcome, red for password reset)
- Buttons are clickable and have white text on coloured background
- "Important Security Information" yellow box renders
- Footer shows correct year and brand name
- Plain-text version renders cleanly when HTML is disabled (toggle in Gmail's "View original")

---

## Troubleshooting Cheat Sheet

| Symptom | Likely cause | Fix |
|---|---|---|
| `ModuleNotFoundError: aiosmtplib` | Dependencies not installed | `pip install -r requirements.txt` |
| `Provider gmail is not configured` | Env vars missing or app not restarted | Check `.env`, restart uvicorn |
| `SMTPAuthenticationError` | App Password wrong/expired | Regenerate at https://myaccount.google.com/apppasswords |
| Email not arriving | Spam folder OR Gmail rate limit | Check spam; if rate-limited, wait or switch provider |
| `TemplateNotFound: auth/verification.html` | Templates not at correct path | Verify `app/Templates/emails/auth/verification.html` exists |
| `Email is already verified` on resend | User already verified — expected | Test with a fresh registration |
| `email_logs` table missing | Auto-migrate didn't run | Restart app; check `app/Models/__init__.py` includes `EmailLog` |
| Welcome email not sending | Look at server logs | If verification succeeded but welcome failed, check `email_logs` for the failed welcome row |

---

## Sign-Off Checklist

Before merging the branch:

- [ ] Step 4 — config loads correctly
- [ ] Step 5 — Gmail provider shows `configured=True`
- [ ] Step 6 — all 3 templates exist (html + txt)
- [ ] Step 7 — `email_logs` table exists
- [ ] Step 8 — smoke test sends successfully
- [ ] Step 9 — registration triggers verification email
- [ ] Step 10 — verification triggers welcome email
- [ ] Step 11 — resend works
- [ ] Step 12 — failure case is non-blocking (registration still succeeds)
- [ ] Visual inspection — emails render correctly in 3+ clients

If all 10 boxes are ticked, the subsystem is production-ready. Merge with confidence.