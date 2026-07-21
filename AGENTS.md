# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `cal-diy`.** A leaf UI app with no dependents; the only exported interface is the `ui` web interface (host id `ui-multi`, interface id `ui` — both exported from `startos/utils.ts`).
- **Three subcontainers, one shared network namespace.** `main.ts` runs `cal-diy-sub` (the Next.js web app, image `main`), `postgres-sub` (a bundled PostgreSQL, image `postgres`), and `cal-cron-sub` (a busybox `crond` sidecar, image `cron`, that fires the upstream Vercel cron jobs on schedule). They all talk to each other — and self-checks reach the app — over `127.0.0.1`, not the LXC bridge, because the subcontainers share the package's network namespace.
- **Bundles its own PostgreSQL.** Backups go through `withPgDump` (`startos/backups.ts`); the DB password lives in `store.json`.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach cal-diy -n <name> -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — here `cal-diy-sub`, `postgres-sub`, or `cal-cron-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
