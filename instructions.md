# Cal.diy

You've installed Cal.diy — the community-driven, fully open-source edition of Cal.com. Self-host scheduling, share booking links, and connect your own calendars and conferencing tools.

## Documentation

- [Cal.com documentation](https://cal.com/docs) — the official feature documentation. Almost everything described there applies to Cal.diy, minus the Enterprise-only features that were removed.
- [Cal.diy upstream repository](https://github.com/calcom/cal.diy) — source, issues, and discussions for the open-source fork.
- [Cal.com community Slack](https://go.cal.com/slack) — upstream community support.

## What you get on StartOS

- A complete, self-hosted Cal.diy instance — the Next.js web app and a private PostgreSQL database, packaged together so there is no external service to configure.
- StartOS generates the required secrets (database password, NextAuth session secret, and the symmetric encryption key Cal.diy uses to protect stored integration credentials) at install time. You never need to write them down.
- A **Set Primary URL** action lets you tell Cal.diy which of its URLs (LAN IP, `.local`, Tor, or a custom domain you've added) to use for booking links, magic-link sign-in, and email content. The package pre-selects your `.local` URL on install so it works on the LAN immediately.
- A **Configure SMTP** action lets you supply (or borrow from StartOS) the SMTP credentials Cal.diy needs to send booking confirmations, reminders, and magic-link sign-in messages.
- **Open signups are off by default** — only the very first admin can be created from the web form; all subsequent users are added by the admin through Cal.diy's own admin console (no risk that a random LAN visitor signs themselves in before you finish setting up). An **Enable/Disable Signups** action lets you flip this if you specifically want to allow public registration.
- A **Reset User Password** action generates a new password for a given email address, useful if you ever lose your password and can't rely on email-based recovery.
- **Booking reminders, OAuth token refresh, calendar feed syncs, and workflow emails just work** — a tiny background scheduler runs the upstream cron jobs on the documented schedule. (Cal.com's hosted product gets these from Vercel cron; we bundle our own.)
- Telemetry is disabled.

## Getting set up

1. Open Cal.diy's **Dashboard** tab and click the **Web UI** interface to open the web app.
2. The first time you open it, Cal.diy will spend a couple of minutes running database migrations and seeding the bundled app store. The Web Interface health check turns green once it's ready — refresh the page if you opened it before that.
3. Create your administrator account on the first-run setup screen (Cal.diy will redirect you there automatically). This is the **first-admin bootstrap** — it works even though open signups are disabled, because Cal.diy only allows it when the user table is empty. Fill in your basic profile, set your time zone, and pick your default working hours.
4. Run the **Set Primary URL** action and choose the URL you want Cal.diy to treat as canonical. Use:
   - Your `.local` URL if Cal.diy is just for you and people on the same LAN.
   - A custom domain you've added to the Web UI interface in StartOS if you want booking links to work over the public internet.
   - The Tor `.onion` URL if you're sharing inside the Tor network.
   The service will restart after you set this; on the next start, Cal.diy rewrites its statically-baked URLs to match — expect tens of seconds of extra startup time.
5. Run the **Configure SMTP** action and either pick **System SMTP** (if you've set up SMTP in StartOS itself) or **Custom** and provide your own SMTP host, port, username, password, and "from" address. Without this, Cal.diy can run, but it cannot send booking confirmation emails or magic-link sign-in messages.
6. (Optional) Inside Cal.diy's settings, connect any calendar or video integrations you want — Google, Apple, Microsoft, Zoom, Daily, and so on. You provide the upstream OAuth credentials for each integration; this package does not ship pre-filled keys for any third-party service.

## Adding more users

Open signups are off by default, so you don't have to do anything to lock the instance down — it's already locked. When you want to add another user:

1. Sign in as the admin you created during setup.
2. Open **Settings → Admin → Users** in Cal.diy and click **Add**.
3. Fill in the new user's name, username, email, and role. Save.
4. Give the new user their first password using **one** of these:
   - **If you have SMTP configured**, tell them to use Cal.diy's "Forgot Password" link on the sign-in page. They'll receive a reset email and pick their own password.
   - **If you don't have SMTP** (or just prefer not to email a password), run StartOS's **Reset User Password** action with the new user's email. StartOS displays the generated password; share it with them out-of-band (Signal, in person, …) and they'll change it themselves on first login.

You only need to run the **Enable/Disable Signups** action if you specifically want strangers on the public internet to be able to create their own accounts on your instance — uncommon for personal scheduling.

## Using Cal.diy

### Web interface

The Web UI is the full Cal.diy app — your scheduling dashboard, event-type editor, availability settings, integrations, booking pages, and admin console all live here. After signup you'll land on the dashboard; share the URL shown under your name as your personal booking link.

### Actions

- **Set Primary URL** — change which URL Cal.diy uses for outbound links. Run it after adding a custom domain in StartOS, or after you decide to expose Cal.diy over Tor instead of the LAN. Restarts the service. **Safe at any time mechanically — but if you change it after Cal.diy has been in use, expect to:** re-register the OAuth redirect URI with every connected calendar/video provider and reconnect each integration here (the callback host they recorded no longer matches), re-sign-in (NextAuth session cookies are tied to the URL's domain), and update any booking links, embed snippets, or email signatures you have shared externally with the old URL. Links inside already-sent booking confirmation emails will continue to point at the old URL.
- **Configure SMTP** — set, change, or disable outbound email. Run it to enable booking emails, or to swap from your own SMTP provider to StartOS system SMTP (or vice versa).
- **Enable/Disable Signups** — close the instance to new account creation, or re-open it. The action's name reflects the current state. Note that the "Create Account" link in the login page footer will still render even when signups are disabled (it's compiled into the static JavaScript bundle by upstream); clicking it lands on a "Signup is disabled" error page.
- **Reset User Password** — generate a new password for the user with the given email. The new password is shown to you once, masked and copyable. Only effective for accounts that authenticate via password — users who sign in only via OAuth (Google, Microsoft, etc.) are unaffected.

If the URL you previously selected becomes unavailable (for example, because you removed a custom domain), StartOS will surface a critical task asking you to pick a new one. Run **Set Primary URL** to clear it.

## Limitations

- The public REST API service (Cal's optional `apps/api/v2`) is not included. The Web UI and tRPC endpoints work; programmatic access through the public `/api/v2` REST surface does not.
- Cal.diy does not include the Enterprise-only features that Cal.com offers — Teams, Organizations, Insights, Workflows, and SSO/SAML are not present. This is an upstream choice; it is not specific to the StartOS package.
- Changing the primary URL triggers a static-asset rewrite inside the container on the next start; expect tens of seconds of extra startup time.
- Cal.diy is intended by upstream for personal, non-production self-hosting. Production-grade deployments are out of scope for both upstream and this package.
