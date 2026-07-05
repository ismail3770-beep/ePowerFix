# 📊 Sentry Alert Configuration Guide

## Step-by-Step: Email Alert for Security Events

### Prerequisite
- Sentry project created at https://sentry.io
- `SENTRY_DSN` set in `.env` and Vercel environment variables
- `@sentry/nextjs` installed (`bun add @sentry/nextjs`)

---

## Step 1: Create an Alert Rule

1. Go to https://sentry.io → select your **ePowerFix** project
2. Left sidebar → **Alerts** → **Create Alert**
3. Select **"Issue Alert"** (triggers when a specific issue occurs)

---

## Step 2: Configure the Alert Condition

### Alert: Security Event Spike (5+ events in 1 minute)

| Field | Value |
|-------|-------|
| **Name** | `Security Event Spike` |
| **If an issue is seen** | `more than 5 times` |
| **In** | `1 minute` |
| **Level** | `Error` (or `Warning` for broader coverage) |

### Advanced Filter (tag-based):
Click **"Add a filter"** and add:
```
tag:security_event matches true
```

This filter matches events tagged with `security_event: true` by our `logSecurityEvent()` function.

---

## Step 3: Configure Actions (Email Notification)

| Field | Value |
|-------|-------|
| **Then perform these actions** | `Send an email to...` |
| **Email recipients** | `your-email@example.com` (add your team) |
| **Also send to** | `#security-alerts` Slack channel (optional) |

### Additional Actions (recommended):
- **Create a JIRA ticket** (if using JIRA)
- **Send to Slack/Teams webhook** (for real-time team notification)

---

## Step 4: Save and Test

1. Click **"Save Alert"**
2. Test by triggering a security event:
   ```bash
   # Try accessing /admin without a token
   curl http://localhost:3000/admin/products

   # Try a CSRF attack (cross-origin POST)
   curl -X POST http://localhost:3000/api/contact \
     -H "Origin: https://evil.com" \
     -H "Content-Type: application/json" \
     -d '{"name":"test","email":"test@test.com","subject":"test","message":"test"}'
   ```
3. Check Sentry dashboard → **Issues** → verify the event appears
4. Verify email arrives within 1-2 minutes

---

## Recommended Additional Alerts

### Alert 2: Brute-Force Login Detection
| Field | Value |
|-------|-------|
| **Name** | `Brute-Force Login Attempt` |
| **Condition** | `Rate limit exceeded` message seen `3+ times` in `5 minutes` |
| **Filter** | `message:*Rate limit exceeded*` AND `path:*auth/login*` |
| **Action** | Email + Slack |

### Alert 3: Privilege Escalation Attempt
| Field | Value |
|-------|-------|
| **Name** | `Privilege Escalation Detected` |
| **Condition** | `Privilege escalation` message seen `1+ time` |
| **Filter** | `tag:security_event matches true` AND `message:*Privilege escalation*` |
| **Action** | Email + Slack + JIRA (high priority) |

### Alert 4: Injection Attack Blocked
| Field | Value |
|-------|-------|
| **Name** | `Injection Attack Blocked` |
| **Condition** | `Malicious input blocked` message seen `1+ time` |
| **Filter** | `tag:security_event matches true` AND `message:*Malicious input*` |
| **Action** | Email (for review) |

### Alert 5: API Error Spike (non-security)
| Field | Value |
|-------|-------|
| **Name** | `API Error Spike` |
| **Condition** | `5xx errors` more than `10 times` in `5 minutes` |
| **Filter** | `level:error` AND `tag:security_event does not match true` |
| **Action** | Email + Slack |

---

## Privacy Compliance Notes

Our `logSecurityEvent()` function automatically:
- ✅ Redacts passwords → `[REDACTED]`
- ✅ Truncates JWT tokens → `eyJhbGciOi...[REDACTED]`
- ✅ Masks API keys → `[API_KEY_REDACTED]`
- ✅ Hashes IP addresses → `ip_abc123def` (one-way hash, GDPR compliant)
- ✅ Masks credit card numbers → `[CARD_REDACTED]`
- ✅ Redacts email addresses → `[EMAIL_HASHED]`
- ✅ Redacts phone numbers → `[PHONE_REDACTED]`
- ✅ Never logs request bodies

This ensures GDPR Article 5 (data minimization) and Article 32 (security of processing) compliance.
