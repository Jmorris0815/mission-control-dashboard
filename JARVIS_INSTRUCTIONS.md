# Jarvis Integration Instructions: Discord to Mission Control

This document outlines how to capture ideas from Discord and create tasks in the Mission Control Command Center using the new HTTP API.

## 1. Objective: Monitor Discord for Ideas

Your primary objective is to monitor the `#ideas` channel across all relevant Discord servers. When a user posts a message that represents a potential task, idea, project, or bug, you are to capture it and submit it to Mission Control.

## 2. How to Create a Task via API

To create a task, you will make a `POST` request to the Mission Control API endpoint. 

- **URL**: `https://effervescent-chicken-480.convex.cloud/api/tasks`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer mc-api-2026-krystalklean`

### Request Body (JSON)

The body of your `POST` request should be a JSON object with the following fields:

| Field         | Type     | Required | Default    | Description                                                                                             |
|---------------|----------|----------|------------|---------------------------------------------------------------------------------------------------------|
| `title`       | `string` | **Yes**  | -          | The main title of the task or idea.                                                                     |
| `description` | `string` | No       | `""`       | A more detailed description of the task.                                                                |
| `company`     | `string` | No       | First company | The name of the company this task belongs to (e.g., "Krystal Klean Exterior"). Defaults to the first one. |
| `priority`    | `string` | No       | `"medium"` | Priority level: `critical`, `high`, `medium`, `low`.                                                    |
| `type`        | `string` | No       | `"idea"`   | The classification of the entry: `idea`, `task`, `project`, `bug`. This will be added as a tag.         |
| `source`      | `string` | No       | `"api"`    | Where the task originated from. Use `"discord"` for these tasks. This will be added as a tag.           |
| `tags`        | `array`  | No       | `[]`       | An array of additional string tags to add to the task.                                                  |


## 3. Example `curl` Command

Here is a complete example of how to submit a new idea from Discord using `curl`.

```bash
curl -X POST https://effervescent-chicken-480.convex.cloud/api/tasks \\
-H "Authorization: Bearer mc-api-2026-krystalklean" \\
-H "Content-Type: application/json" \\
-d '{
  "title": "Create a new landing page for the spring cleaning promotion",
  "description": "User @someuser suggested we need a dedicated page for the spring promo. It should highlight the 20% discount and have a clear call-to-action.",
  "company": "Krystal Klean Exterior",
  "type": "idea",
  "source": "discord",
  "priority": "high"
}'
```

## 4. Confirmation Webhook

Upon successfully creating a task, the API will return the new `taskId`. You should then post a confirmation message back to the `#ideas` channel to let users know their idea has been captured.

- **Discord Webhook URL**: `https://discord.com/api/webhooks/1477438592493293638/xaV90J-QFspID5sqCqS1MD_QralgYh1q1GaamEOksFmIV4anjESshzEP3sbvYgzDxQJZ`

**Example Confirmation Message:**

> "✅ Idea captured! Mission Control task ID: `[taskId]`"
