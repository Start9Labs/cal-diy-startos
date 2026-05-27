import { T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  builtWebappUrl,
  postgresDb,
  postgresPort,
  postgresUser,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Cal.diy!'))

  const store = await storeJson.read((s) => s).const(effects)
  if (!store) throw new Error(i18n('store.json not found'))

  const postgresPassword = store.postgresPassword ?? ''
  const nextAuthSecret = store.nextAuthSecret ?? ''
  const calendsoEncryptionKey = store.calendsoEncryptionKey ?? ''
  const cronApiKey = store.cronApiKey ?? ''
  const webappUrl = store.url ?? builtWebappUrl
  const signupDisabled = store.signupDisabled ?? false

  // ALLOWED_HOSTNAMES is interpolated by cal into `[${env}]` and JSON.parsed
  // (see packages/lib/constants.ts), so the value must be comma-separated
  // quoted strings, no outer brackets. Pre-fill the chosen primary URL's
  // host so the package matches whatever address users actually reach it on.
  // Note: in cal.diy v6.2.0 this constant has no production consumers
  // (organizations were removed upstream), so this is defensive only.
  let allowedHostnames = ''
  try {
    allowedHostnames = `"${new URL(webappUrl).host}"`
  } catch {
    // Ignore; webappUrl falls back to builtWebappUrl which is always a valid URL
  }

  let smtpCredentials: T.SmtpValue | null = null
  if (store.smtp?.selection === 'system') {
    smtpCredentials = await sdk.getSystemSmtp(effects).const()
    const customFrom = store.smtp.value.customFrom as string | undefined
    if (smtpCredentials && customFrom) smtpCredentials.from = customFrom
  } else if (store.smtp?.selection === 'custom') {
    // Custom SMTP stores the credentials nested under provider.value, not flat
    // like T.SmtpValue. Extract and flatten before mapping to env vars.
    const v = (store.smtp.value as unknown as { provider?: { value?: any } })
      ?.provider?.value
    if (v?.host && v?.from) {
      const port = parseInt(v.security?.value?.port ?? '587', 10)
      smtpCredentials = {
        host: v.host,
        port: Number.isFinite(port) ? port : 587,
        from: v.from,
        username: v.username ?? '',
        password: v.password ?? null,
        security: v.security?.selection ?? 'starttls',
      } as T.SmtpValue
    }
  }

  const smtpEnv: Record<string, string> = {}
  if (smtpCredentials?.host && smtpCredentials?.from) {
    // cal.com always formats outbound `from` as `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`.
    // If the user's `from` is already a `Name <email>` string, EMAIL_FROM
    // would double-wrap (`Cal.com <Cal.diy <user@example.com>>`). Split it
    // so EMAIL_FROM is always the bare address.
    const match = smtpCredentials.from.match(/^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/)
    if (match) {
      const [, name, email] = match
      smtpEnv.EMAIL_FROM = email
      if (name) smtpEnv.EMAIL_FROM_NAME = name
    } else {
      smtpEnv.EMAIL_FROM = smtpCredentials.from
    }
    smtpEnv.EMAIL_SERVER_HOST = smtpCredentials.host
    smtpEnv.EMAIL_SERVER_PORT = String(smtpCredentials.port)
    if (smtpCredentials.username) {
      smtpEnv.EMAIL_SERVER_USER = smtpCredentials.username
    }
    if (smtpCredentials.password) {
      smtpEnv.EMAIL_SERVER_PASSWORD = smtpCredentials.password
    }
  }
  const smtpReady = !!smtpEnv.EMAIL_SERVER_HOST

  const postgresSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      subpath: null,
      mountpoint: '/var/lib/postgresql',
      readonly: false,
    }),
    'postgres-sub',
  )

  const appSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'main' },
    sdk.Mounts.of(),
    'cal-diy-sub',
  )

  const cronSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'cron' },
    sdk.Mounts.of(),
    'cal-cron-sub',
  )

  const databaseUrl = `postgresql://${postgresUser}:${postgresPassword}@127.0.0.1:${postgresPort}/${postgresDb}`

  // Vercel-style cron schedule mirrored from upstream's apps/web/vercel.json.
  // Without these jobs running, booking reminders never send, OAuth tokens for
  // calendar integrations are never refreshed (Google/Microsoft tokens expire
  // after ~1h), workflow SMS/email never fires, and calendar subscriptions
  // never sync. We bundle a tiny alpine sidecar with busybox crond + curl that
  // hits each /api/cron and /api/tasks endpoint on the documented schedule.
  // Auth: cal accepts either `Authorization: <CRON_API_KEY>` (raw, no Bearer)
  // or `?apiKey=<key>`. Query param is simpler in a busybox crontab.
  const cronCmd = (path: string) =>
    `curl -fsS --max-time 300 -o /dev/null "http://127.0.0.1:${uiPort}${path}?apiKey=${cronApiKey}" || true`
  const cronScript = `set -e
mkdir -p /etc/crontabs
cat > /etc/crontabs/root <<'CRONTAB'
* * * * * ${cronCmd('/api/tasks/cron')}
*/5 * * * * ${cronCmd('/api/cron/calendar-subscriptions')}
*/5 * * * * ${cronCmd('/api/cron/credentials')}
*/5 * * * * ${cronCmd('/api/cron/selected-calendars')}
0 3 * * * ${cronCmd('/api/cron/calendar-subscriptions-cleanup')}
0 */12 * * * ${cronCmd('/api/cron/queuedFormResponseCleanup')}
0 0 * * * ${cronCmd('/api/tasks/cleanup')}
CRONTAB
exec crond -f -l 8
`

  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(['-c', 'listen_addresses=127.0.0.1']),
        env: {
          POSTGRES_USER: postgresUser,
          POSTGRES_PASSWORD: postgresPassword,
          POSTGRES_DB: postgresDb,
        },
      },
      ready: {
        display: i18n('Database'),
        fn: async () => {
          const { exitCode } = await postgresSub.exec([
            'pg_isready',
            '-U',
            postgresUser,
            '-d',
            postgresDb,
            '-h',
            '127.0.0.1',
          ])
          return exitCode === 0
            ? { result: 'success', message: i18n('PostgreSQL is ready') }
            : {
                result: 'loading',
                message: i18n('Waiting for PostgreSQL to be ready'),
              }
        },
      },
      requires: [],
    })
    .addDaemon('cal-diy', {
      subcontainer: appSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          DATABASE_URL: databaseUrl,
          DATABASE_DIRECT_URL: databaseUrl,
          DATABASE_HOST: `127.0.0.1:${postgresPort}`,
          NEXTAUTH_SECRET: nextAuthSecret,
          NEXTAUTH_URL: webappUrl,
          CALENDSO_ENCRYPTION_KEY: calendsoEncryptionKey,
          NEXT_PUBLIC_WEBAPP_URL: webappUrl,
          NEXT_PUBLIC_WEBSITE_URL: webappUrl,
          BUILT_NEXT_PUBLIC_WEBAPP_URL: builtWebappUrl,
          NEXT_PUBLIC_DISABLE_SIGNUP: signupDisabled ? 'true' : '',
          ALLOWED_HOSTNAMES: allowedHostnames,
          // Cron sidecar uses this to authenticate against /api/cron/* and
          // /api/tasks/*. Same key is baked into the crontab at start.
          CRON_API_KEY: cronApiKey,
          // Enable the tasker so /api/tasks/cron actually has work to drain
          // (booking reminder emails, workflow webhooks, etc.).
          ENABLE_ASYNC_TASKER: 'true',
          TASKER_ENABLE_EMAILS: '1',
          TASKER_ENABLE_WEBHOOKS: '1',
          CALCOM_TELEMETRY_DISABLED: '1',
          NEXT_TELEMETRY_DISABLED: '1',
          // Cal's proxy.ts disables CSP entirely when CSP_POLICY is unset.
          // Setting it turns on nonce-based CSP only on /auth/login + /login
          // (the credential-theft-risk pages). 'non-strict' relaxes style-src
          // to 'unsafe-inline' but keeps the nonce-based script-src + strict-
          // dynamic — the actual XSS defense. Strict mode would block inline
          // styles on the login page; cosmetically risky for no real win.
          CSP_POLICY: 'non-strict',
          NODE_ENV: 'production',
          ...smtpEnv,
        },
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 300000,
        fn: () =>
          // Probe /api/version rather than just port-listening so we know
          // the Next.js router and Prisma client are actually serving
          // requests, not just bound to the port.
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://127.0.0.1:${uiPort}/api/version`,
            {
              timeout: 5000,
              successMessage: i18n('Cal.diy is ready'),
              errorMessage: i18n('Cal.diy is not ready'),
            },
          ),
      },
      requires: ['postgres'],
    })
    .addDaemon('cron', {
      subcontainer: cronSub,
      exec: {
        command: ['sh', '-c', cronScript],
      },
      ready: {
        display: i18n('Background Jobs'),
        fn: async () => ({
          result: 'success',
          message: i18n(
            'Cron sidecar is running. Booking reminders, OAuth credential refresh, calendar sync, and workflow emails fire on schedule.',
          ),
        }),
      },
      requires: ['cal-diy'],
    })
    .addHealthCheck('primary-url', {
      ready: {
        display: i18n('Primary URL'),
        fn: async () => ({
          result: 'success',
          message: i18n(
            'Booking links, email confirmations, and magic-link logins all point at ${url}. Use the "Set Primary URL" action to change this.',
            { url: webappUrl },
          ),
        }),
      },
      requires: ['cal-diy'],
    })
    .addHealthCheck('email', {
      ready: {
        display: i18n('Email Delivery'),
        fn: async () =>
          smtpReady
            ? {
                result: 'success',
                message: i18n('SMTP configured — Cal.diy can send email.'),
              }
            : {
                result: 'disabled',
                message: i18n(
                  'SMTP not configured. Booking confirmations and magic-link sign-in will not send email until you run the "Configure SMTP" action.',
                ),
              },
      },
      requires: ['cal-diy'],
    })
})
