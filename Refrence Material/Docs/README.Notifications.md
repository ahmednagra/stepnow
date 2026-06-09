# 🔔 In-App Notification System

Industry-standard, channel-pluggable notification system for the dashboard
notification panel. Built to match the existing backend conventions
(status_id → statuses, `<entity>_metadata` JSONB, service-owns-events,
EmailService facade reuse, auto-migrate models, `routes/api/v0` registration).

---

## What this delivers

- **Durable inbox** (`notifications` table) — one row per recipient (fan-out
  on write). Powers the panel + history; survives disconnect/refresh.
- **Per-user preferences** (`notification_preferences` table) — JSONB
  `channel_preferences` that is *matrix-ready* (v1 simple → v2 per-type with
  NO migration).
- **One public facade** — `NotificationService`. Features import only this.
- **Pluggable channels** — `DatabaseChannel` (DB row + WebSocket push) and
  `EmailChannel` (adapter over the existing `EmailService`). PushChannel /
  SmsChannel slot in later with one registry line.
- **Code-level type registry** — `app/Services/Notifications/types.py`
  (no DB table for types/categories; same idea as the WS EventType registry).
- **REST endpoints** — list, unread-count, mark-read, mark-all-read, archive,
  clear, get/update preferences.
- **Real-time** — reuses the existing `event_publisher` + `user:{id}` channel
  and the already-registered `notification.*` EventTypes.
- **Retention** — `NotificationCleanupService` hard-deletes past the per-type
  window (read +Nd / unread +Nd; billing & security kept 180d).

---

## File map (new files)

```
app/Models/
  notification.py                         class Notification           → table: notifications
  notification_preference.py              class NotificationPreference → table: notification_preferences

app/Schemas/notifications/
  notification.py                         panel request/response schemas
  notification_preference.py              preference schemas

app/Services/Notifications/
  __init__.py                             (UPDATED) re-exports NotificationService + EmailService
  NotificationService.py                  ⭐ public facade — the ONE import
  NotificationDispatcher.py               multi-channel fan-out per recipient
  PreferenceResolver.py                   resolves enabled channels (v1+v2 shapes)
  NotificationCleanupService.py           retention hard-delete (nightly)
  types.py                                NOTIFICATION_TYPES code registry
  Channels/
    __init__.py
    BaseChannel.py                        abstract channel contract
    DatabaseChannel.py                    DB row + WebSocket push
    EmailChannel.py                       adapter → existing EmailService

app/Http/Controllers/
  NotificationController.py               panel HTTP orchestration

routes/api/v0/
  notifications.py                        REST endpoints

app/WebSocket/events/
  notification.py                         (FILLED IN) NotificationEventHandler

app/Utils/dictionaries/
  notification_statuses.py                NOTIFICATION_STATUSES seeds
```

---

## Wiring into existing files (small, additive edits)

### 1. Register models — `app/Models/__init__.py`
Add after the other Level-2 model imports (after `email_log`):

```python
from app.Models.notification import Notification
from app.Models.notification_preference import NotificationPreference
```
And add `'Notification', 'NotificationPreference'` to `__all__`.
> Auto-migrate creates both tables on startup — no Alembic file needed
> (same as the email_logs / backup_jobs precedent).

### 2. Seed statuses — `app/Utils/dictionaries/__init__.py`
Where `DEFAULT_STATUSES` is assembled:

```python
from app.Utils.dictionaries.notification_statuses import NOTIFICATION_STATUSES
DEFAULT_STATUSES = [
    *DEFAULT_STATUSES,           # existing
    *NOTIFICATION_STATUSES,
]
```
The existing `initialize_default_statuses()` seeds them (idempotent).

### 3. Register routes — `routes/__init__.py`
With the other v0 imports and includes:

```python
from routes.api.v0 import notifications
app.include_router(notifications.router, prefix=settings.API_V0_STR, include_in_schema=False)
```

### 4. (Optional) Schedule cleanup
Call `NotificationCleanupService.purge_expired(db)` from your existing nightly
scheduler (same place campaign deadline sweeps run).

---

## Firing a notification (pilot example — outreach)

In the handler that runs when the campaign manager clicks **Outreach** (after
it assigns influencers to the outreach manager — that code already knows the
manager's user id):

```python
from app.Services.Notifications import NotificationService

await NotificationService.send(
    user_id=str(outreach_manager.id),
    user_type=outreach_manager.user_type,          # 'b2b'
    notification_type="outreach.requested",
    title=f"{len(influencers)} influencers ready for outreach",
    body=f'{actor.full_name} assigned {len(influencers)} influencers to you.',
    action_url=f"/outreach/{batch.id}",
    company_id=str(company.id),
    source_entity_type="outreach_batch",
    source_entity_id=str(batch.id),
    triggered_by_user_id=str(actor.id),
    notification_metadata={"influencer_count": len(influencers)},
    db=db,
)
```

Multiple recipients — caller makes ONE call, fan-out is internal:

```python
await NotificationService.send_to_many(
    recipients=[{"user_id": str(m.id), "user_type": m.user_type} for m in members],
    notification_type="campaign.created",
    title=f'Campaign "{campaign.name}" created',
    body="A new campaign was created in your workspace.",
    action_url=f"/campaigns/{campaign.id}",
    company_id=str(company.id),
    source_entity_type="campaign",
    source_entity_id=str(campaign.id),
    triggered_by_user_id=str(actor.id),
    db=db,
)
```

> Tip: invoke via `BackgroundTasks` (like the email subsystem) so notification
> delivery never blocks or breaks the triggering request.

---

## Flow

1. Feature calls `NotificationService.send(...)` with a known type + recipient.
2. Dispatcher checks the type is applicable to the user type, then asks
   `PreferenceResolver` which channels are enabled for that user.
3. `DatabaseChannel` writes the `notifications` row and emits
   `notification.created` on `user:{id}` (idempotency key = row id → existing
   dedup suppresses duplicates). `EmailChannel` (if enabled + template present)
   delegates to `EmailService`.
4. Frontend panel updates instantly from the WS event; the row backs history.
5. Mark-read / clear go through `NotificationController`, which transitions
   `status_id` and emits `notification.read` / `notification.cleared`.

---

## Test events wired (4)

See `app/Services/Notifications/INTEGRATION_SNIPPETS.py` for copy-paste-ready
methods + the exact call sites. Recipient policy (industry standard; change in
`RecipientResolver` to adjust globally):

| Event | Fired from | Who is notified |
|---|---|---|
| `campaign.created` | `CampaignController.create_campaign` | All company members, minus the creator |
| `team.member_invited` | `InvitationController.create_invitation` | **Admins/owners only**, minus the inviter (invitee gets the existing email — they have no dashboard yet) |
| `team.member_joined` + `team.member_welcome` | `InvitationController` accept paths | **Admins/owners** (minus joiner) get "joined"; the joiner gets a "welcome" |
| `team.member_removed` | `TeamMemberController.remove_team_member` | **Admins/owners only**, minus the removed user and the actor (removed user is intentionally NOT notified in-app) |

Why: roster/governance events (invite/join/remove) route to admins/owners,
matching GitHub/Slack/Notion. `campaign.created` stays all-members for now —
on a small team that IS the relevant audience; tighten to assigned-members
later (one-flag change). The actor is always excluded (no self-notifications).

`RecipientResolver` (new) provides `company_members(...)` and `single_user(...)`.

### Easiest to trigger for a first frontend test
`campaign.created` (one create call) or `team.member_invited` (one invite
form submit). Both produce a real notification you can watch arrive over the
WebSocket and fetch via `GET /api/v0/notifications`.

---

## Adding a new notification type

1. Add an entry to `NOTIFICATION_TYPES` in `types.py` (category, priority,
   icon, applicable_user_types, default_channels, email_template, retention).
2. Call `NotificationService.send(notification_type="your.new_type", ...)`
   from the feature that triggers it. That's it — no schema change.