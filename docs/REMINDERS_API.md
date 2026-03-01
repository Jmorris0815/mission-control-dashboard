# Reminders API — Mission Control

**Base URL:** `https://mission-control-dashboard-plum-two.vercel.app`  
**Endpoint:** `/api/reminders`  
**Auth Token:** `mc-api-2026-krystalklean` (pass as `?token=...` query param or `Authorization: Bearer ...` header)

---

## Quick Reference for Jarvis (web_fetch GET)

### Create a Reminder

```
GET /api/reminders?token=mc-api-2026-krystalklean&action=create&title=Review+weekly+KPIs&due=+2h&priority=high&agent=Jarvis&company=Krystal+Klean+Exterior
```

### Check Due Reminders

```
GET /api/reminders?token=mc-api-2026-krystalklean&action=check-due
```

### Complete a Reminder

```
GET /api/reminders?token=mc-api-2026-krystalklean&action=complete&id=REMINDER_ID
```

### Snooze a Reminder

```
GET /api/reminders?token=mc-api-2026-krystalklean&action=snooze&id=REMINDER_ID&minutes=30
```

### List All Reminders

```
GET /api/reminders?token=mc-api-2026-krystalklean
```

---

## Actions (via `?action=` parameter)

| Action | Description | Required Params |
|--------|-------------|-----------------|
| `list` (default) | List all reminders | — |
| `create` | Create a new reminder | `title`, `due` |
| `complete` | Mark as completed (auto-creates next if recurring) | `id` |
| `snooze` | Snooze for N minutes | `id`, `minutes` (default: 30) |
| `dismiss` | Dismiss a reminder | `id` |
| `trigger` | Manually trigger a pending reminder | `id` |
| `check-due` | Get all overdue/due reminders | — |
| `upcoming` | Get reminders due in next N hours | `hours` (default: 24) |
| `delete` | Permanently delete a reminder | `id` |

---

## Create Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `title` | Yes | — | Reminder title |
| `due` / `dueAt` | Yes | — | When it's due (see formats below) |
| `description` | No | — | Optional details |
| `priority` | No | `medium` | `critical`, `high`, `medium`, `low` |
| `recurrence` | No | `none` | `none`, `daily`, `weekly`, `monthly` |
| `agent` | No | — | Agent name (resolves to agentId) |
| `createdBy` | No | `api` | Who created it |
| `company` | No | — | Company name (resolves to companyId) |
| `tags` | No | — | Comma-separated tags |

### Due Date Formats

| Format | Example | Description |
|--------|---------|-------------|
| Relative | `+30m` | 30 minutes from now |
| Relative | `+2h` | 2 hours from now |
| Relative | `+1d` | 1 day from now |
| Relative | `+1w` | 1 week from now |
| ISO 8601 | `2026-03-15T09:00:00Z` | Specific date/time |
| Unix ms | `1742025600000` | Unix timestamp in milliseconds |

---

## Response Examples

### Create Success

```json
{
  "success": true,
  "message": "Reminder \"Review weekly KPIs\" created — due 2026-03-01T18:00:00.000Z",
  "reminderId": "k177abc123...",
  "dueAt": "2026-03-01T18:00:00.000Z",
  "priority": "high",
  "recurrence": "none",
  "createdBy": "Jarvis"
}
```

### Check Due

```json
{
  "success": true,
  "count": 2,
  "reminders": [
    {
      "id": "k177abc123...",
      "title": "Review weekly KPIs",
      "description": null,
      "dueAt": "2026-03-01T16:00:00.000Z",
      "priority": "high",
      "createdBy": "Jarvis",
      "status": "pending"
    }
  ]
}
```

### Complete (Recurring)

```json
{
  "success": true,
  "completedId": "k177abc123...",
  "nextId": "k177def456...",
  "nextDue": 1742112000000
}
```

---

## Jarvis Workflow

### Morning Routine

1. **Check due reminders:** `?action=check-due`
2. **Process each one:** Complete, snooze, or trigger as needed
3. **Create new reminders** for upcoming tasks

### Setting Recurring Reminders

```
?action=create&title=Daily+standup+report&due=+1d&recurrence=daily&priority=high&agent=Jarvis
```

This creates a daily reminder. When completed, a new one is automatically created for the next day.

### Snooze Options

```
?action=snooze&id=REMINDER_ID&minutes=15    # 15 minutes
?action=snooze&id=REMINDER_ID&minutes=60    # 1 hour
?action=snooze&id=REMINDER_ID&minutes=1440  # 1 day
```

---

## Status Lifecycle

```
pending → triggered → completed
pending → snoozed → pending (when snooze expires) → triggered → completed
pending → dismissed
```

- **pending:** Waiting for due time
- **triggered:** Due time has passed, needs attention
- **snoozed:** Temporarily delayed
- **completed:** Done (if recurring, next occurrence auto-created)
- **dismissed:** Cancelled/ignored

---

## POST Method (for richer payloads)

```bash
curl -X POST "https://mission-control-dashboard-plum-two.vercel.app/api/reminders?token=mc-api-2026-krystalklean" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review Q1 financials",
    "description": "Check revenue across all 3 companies",
    "due": "+4h",
    "priority": "high",
    "recurrence": "monthly",
    "agent": "Ledger",
    "company": "Krystal Klean Exterior",
    "tags": ["finance", "quarterly"],
    "metadata": {"quarter": "Q1", "year": 2026}
  }'
```

---

## Error Responses

| Status | Error |
|--------|-------|
| 401 | `Unauthorized` — invalid or missing token |
| 400 | `Missing required param: title` |
| 400 | `Missing required param: due` |
| 400 | `Invalid due format: "..."` |
| 400 | `Missing required param: id` |
| 500 | Internal server error with message |
