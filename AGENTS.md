# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **The cron sidecar is load-bearing, and its schedule mirrors upstream's `vercel.json`.** Without it, booking reminders never send, calendar OAuth tokens expire within the hour and are never refreshed, workflows never fire, and calendar subscriptions never sync. If you touch the crontab, re-derive it from upstream's file rather than editing entries in place.
- **`toggle-signup` writes only the env flag, never the database.** Cal's gate is `NEXT_PUBLIC_DISABLE_SIGNUP === 'true' || dbFeatureFlag`, so the env half is sufficient, and touching the DB row would force the action to `only-running` for nothing.
- **Signups being closed does not block the first admin.** Upstream's setup route gates on `userCount === 0`, not on the signup flag. Don't add a bootstrap step to work around a problem that does not exist.
- **The Stripe credentials are all-or-nothing by construction.** Upstream seeds its Stripe app at boot only when all four are present, which is why the action models them as a union variant rather than four optional fields. Keep that shape.
- **`store.json` is on the `startos` volume and the app subcontainer mounts nothing.** Everything reaches Cal.diy as environment. If you need to give it a file, that is a change of shape, not a small addition.
