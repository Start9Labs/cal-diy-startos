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
  const webappUrl = store.url ?? builtWebappUrl

  let smtpCredentials: T.SmtpValue | null = null
  if (store.smtp?.selection === 'system') {
    smtpCredentials = await sdk.getSystemSmtp(effects).const()
    const customFrom = store.smtp.value.customFrom as string | undefined
    if (smtpCredentials && customFrom) smtpCredentials.from = customFrom
  } else if (store.smtp?.selection === 'custom') {
    smtpCredentials = store.smtp.value as unknown as T.SmtpValue
  }

  const smtpEnv: Record<string, string> = {}
  if (smtpCredentials) {
    smtpEnv.EMAIL_FROM = smtpCredentials.from
    smtpEnv.EMAIL_FROM_NAME = 'Cal.diy'
    smtpEnv.EMAIL_SERVER_HOST = smtpCredentials.host
    smtpEnv.EMAIL_SERVER_PORT = String(smtpCredentials.port)
    if (smtpCredentials.username) {
      smtpEnv.EMAIL_SERVER_USER = smtpCredentials.username
    }
    if (smtpCredentials.password) {
      smtpEnv.EMAIL_SERVER_PASSWORD = smtpCredentials.password
    }
  }

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

  const databaseUrl = `postgresql://${postgresUser}:${postgresPassword}@127.0.0.1:${postgresPort}/${postgresDb}`

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
          CALCOM_TELEMETRY_DISABLED: '1',
          NEXT_TELEMETRY_DISABLED: '1',
          NODE_ENV: 'production',
          ...smtpEnv,
        },
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 300000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('Cal.diy is ready'),
            errorMessage: i18n('Cal.diy is not ready'),
          }),
      },
      requires: ['postgres'],
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
          smtpCredentials
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
