<p align="center">
  <img src="icon.svg" alt="Cal.diy Logo" width="21%">
</p>

# Cal.diy on StartOS

> **Upstream repo:** <https://github.com/calcom/cal.diy>
> **Upstream docs:** <https://cal.com/docs>
>
> Everything not listed in this document should behave the same as upstream
> Cal.diy. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

Cal.diy is the community-driven, fully open-source edition of Cal.com — a scheduling platform for booking meetings, managing availability, and connecting external calendars.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| App image     | `calcom/cal.com` (upstream Docker Hub; per-arch tags selected at build) |
| Database      | `postgres:16-alpine`                                                 |
| Architectures | x86_64, aarch64                                                      |
| Entrypoint    | Upstream `start.sh` (runs Prisma migrations + app store seed, then starts Next.js) |

Upstream publishes amd64 and arm64 as separate tags rather than a multi-arch manifest list. A thin Dockerfile in this repo selects the correct tag per architecture at pack time.

---

## Volume and Data Layout

| Volume    | Mount Point             | Purpose                                                              |
| --------- | ----------------------- | -------------------------------------------------------------------- |
| `startos` | `/media/startos/volumes/startos` | StartOS-managed `store.json` (secrets generated at install time) |
| `db`      | `/var/lib/postgresql`   | PostgreSQL data directory                                            |

---

## Installation and First-Run Flow

On first install:

1. StartOS generates and stores three secrets in `store.json`:
   - `postgresPassword` — the password for the bundled PostgreSQL sidecar.
   - `nextAuthSecret` — `NEXTAUTH_SECRET`, used to sign session tokens.
   - `calendsoEncryptionKey` — `CALENDSO_ENCRYPTION_KEY`, used by Cal.diy for symmetric encryption of integration credentials.
2. PostgreSQL starts and the `cal-diy` daemon waits for it.
3. The `cal-diy` daemon runs `prisma migrate deploy` against the empty database, seeds the bundled app store, then launches Next.js.

Once the **Web Interface** health check turns green, open the **Web UI** from the Dashboard tab and create the first administrator account in the Cal.diy signup flow.

---

## Configuration Management

| StartOS-Managed                          | Upstream-Managed                                            |
| ---------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`, `DATABASE_DIRECT_URL`, `DATABASE_HOST` (pointed at the sidecar PostgreSQL) | All user accounts, event types, availability, integrations, and bookings (managed inside the Cal.diy UI) |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL`        | SMTP / OAuth provider credentials (set in the Cal.diy UI)   |
| `CALENDSO_ENCRYPTION_KEY`                |                                                             |
| `NEXT_PUBLIC_WEBAPP_URL`, `NEXT_PUBLIC_WEBSITE_URL`, `BUILT_NEXT_PUBLIC_WEBAPP_URL` (set to `http://localhost:3000` to match the bake-time value, so the upstream `replace-placeholder.sh` is a no-op) | |
| `CALCOM_TELEMETRY_DISABLED=1`, `NEXT_TELEMETRY_DISABLED=1` | |
| `NODE_ENV=production`                    |                                                             |

---

## Network Access and Interfaces

| Interface | Port | Protocol | Purpose            |
| --------- | ---- | -------- | ------------------ |
| Web UI    | 3000 | HTTP     | Cal.diy web app    |

**Access methods:**

- LAN IP with unique port
- `<hostname>.local` with unique port
- Tor `.onion` address
- Custom domains (if configured)

---

## Actions (StartOS UI)

None.

---

## Backups and Restore

**Included in backup:**

- Full PostgreSQL dump of the `calendso` database (taken with `pg_dump` against the sidecar)
- `startos` volume (preserves the generated secrets so a restore continues to decrypt existing integration credentials)

**Restore behavior:** PostgreSQL is dump-restored before the `cal-diy` daemon starts.

---

## Health Checks

| Check          | Method                              | Messages                                                                 |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| Database       | `pg_isready` against the sidecar    | Success: "PostgreSQL is ready" / Loading: "Waiting for PostgreSQL to be ready" |
| Web Interface  | Port listening (3000)               | Success: "Cal.diy is ready" / Error: "Cal.diy is not ready"              |

The web check has a 3-minute grace period because Cal.diy runs Prisma migrations and seeds the app store on first start.

---

## Dependencies

None.

---

## Limitations and Differences

1. **No public REST API.** Upstream's optional `apps/api/v2` service (NestJS + Redis) is not packaged. The web UI, tRPC, and integrations all work; programmatic access via the public `/api/v2` REST endpoints does not.
2. **Absolute URLs are baked at `http://localhost:3000`.** Cal.diy bakes `NEXT_PUBLIC_WEBAPP_URL` into the static build at upstream build time. Booking confirmation emails and other absolute links will use the URL that is baked in; for them to point at your real address, configure a custom domain in StartOS and serve the package through it.
3. **No enterprise features.** Cal.diy upstream has removed Teams, Organizations, Insights, Workflows, SSO/SAML, and other commercial features that exist in Cal.com. None of them are available here either.
4. **Telemetry is disabled** via `CALCOM_TELEMETRY_DISABLED=1` and `NEXT_TELEMETRY_DISABLED=1`.

---

## What Is Unchanged from Upstream

- All scheduling, availability, event-type, and booking functionality
- All upstream-provided calendar / video integrations (Google, Apple, Microsoft, Zoom, Daily, etc. — configurable through the Cal.diy UI once you provide your own credentials)
- The full Cal.diy admin dashboard
- The Cal.diy public booking pages

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: cal-diy
image: calcom/cal.com
architectures: [x86_64, aarch64]
volumes:
  startos: /media/startos/volumes/startos
  db: /var/lib/postgresql
ports:
  ui: 3000
dependencies: none
startos_managed_env_vars:
  - DATABASE_URL
  - DATABASE_DIRECT_URL
  - DATABASE_HOST
  - NEXTAUTH_SECRET
  - NEXTAUTH_URL
  - CALENDSO_ENCRYPTION_KEY
  - NEXT_PUBLIC_WEBAPP_URL
  - NEXT_PUBLIC_WEBSITE_URL
  - BUILT_NEXT_PUBLIC_WEBAPP_URL
  - CALCOM_TELEMETRY_DISABLED
  - NEXT_TELEMETRY_DISABLED
  - NODE_ENV
actions: none
```
