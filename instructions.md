# Cal.diy

You've installed Cal.diy — the community-driven, fully open-source edition of Cal.com. Self-host scheduling, share booking links, and connect your own calendars and conferencing tools.

## Documentation

- [Cal.com documentation](https://cal.com/docs) — the official feature documentation. Almost everything described there applies to Cal.diy, minus the Enterprise-only features that were removed.
- [Cal.diy upstream repository](https://github.com/calcom/cal.diy) — source, issues, and discussions for the open-source fork.
- [Cal.com community Slack](https://go.cal.com/slack) — upstream community support.

## What you get on StartOS

- A complete, self-hosted Cal.diy instance — the Next.js web app and a private PostgreSQL database, packaged together so there is no external service to configure.
- StartOS generates the required secrets (database password, NextAuth session secret, and the symmetric encryption key Cal.diy uses to protect stored integration credentials) at install time. You never need to write them down.
- The Web UI is exposed on port 3000 and reachable over LAN, `.local`, Tor, or any custom domain you add to the package.
- Telemetry is disabled.

## Getting set up

1. Open Cal.diy's **Dashboard** tab and click the **Web UI** interface to open the web app.
2. The first time you open it, Cal.diy will spend a minute or two running database migrations and seeding the bundled app store. The Web Interface health check will turn green once it's ready — if you opened the page before that, just refresh.
3. Create your administrator account on the signup screen. Cal.diy does not skip its own onboarding — fill in the basic profile, set your time zone, and pick your default working hours.
4. (Optional but recommended) Add a custom domain to the Web UI interface in StartOS if you intend to share booking links publicly. Booking confirmation emails and other absolute links Cal.diy generates point at the URL baked into the build — they will work correctly when your booking page is served over a stable, public address.
5. (Optional) From the Cal.diy settings, configure SMTP (so booking emails go out from your own address) and connect any calendar or video integrations you want. You provide the upstream OAuth credentials for each integration; this package does not ship pre-filled keys for any third-party service.

## Using Cal.diy

### Web interface

The Web UI is the full Cal.diy app — your scheduling dashboard, event-type editor, availability settings, integrations, booking pages, and admin console all live here. After signup you'll land on the dashboard; share the URL shown under your name as your personal booking link.

## Limitations

- The public REST API service (Cal's optional `apps/api/v2`) is not included. The Web UI and tRPC endpoints work; programmatic access through the public `/api/v2` REST surface does not.
- Cal.diy does not include the Enterprise-only features that Cal.com offers — Teams, Organizations, Insights, Workflows, and SSO/SAML are not present. This is an upstream choice; it is not specific to the StartOS package.
- Cal.diy bakes the public web app URL into its static build. Absolute links in outbound emails and embeds use that baked URL; configuring a custom domain on the Web UI interface is the supported way to make those links work outside your LAN.
- Cal.diy is intended by upstream for personal, non-production self-hosting. Production-grade deployments are out of scope for both upstream and this package.
