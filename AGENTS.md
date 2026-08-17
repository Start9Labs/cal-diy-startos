# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **The cron sidecar is load-bearing, and its schedule mirrors upstream's `vercel.json`.** Without it, booking reminders never send, calendar OAuth tokens expire within the hour and are never refreshed, workflows never fire, and calendar subscriptions never sync. If you touch the crontab, re-derive it from upstream's file rather than editing entries in place.
- **`toggle-signup` writes only the env flag, never the database.** Cal's gate is `NEXT_PUBLIC_DISABLE_SIGNUP === 'true' || dbFeatureFlag`, so the env half is sufficient, and touching the DB row would force the action to `only-running` for nothing.
- **Signups being closed does not block the first admin.** Upstream's setup route gates on `userCount === 0`, not on the signup flag. Don't add a bootstrap step to work around a problem that does not exist.
- **The Stripe credentials are all-or-nothing by construction.** Upstream seeds its Stripe app at boot only when all four are present, which is why the action models them as a union variant rather than four optional fields. Keep that shape.
- **`store.json` is on the `startos` volume and the app subcontainer mounts nothing.** Everything reaches Cal.diy as environment. If you need to give it a file, that is a change of shape, not a small addition.
