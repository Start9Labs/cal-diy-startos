import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { databaseUrl, pgIsReady, postgresEnv, postgresSub } from '../utils'

// start.sh's own `prisma migrate deploy` then finds nothing to apply, so a
// restart of `main` can never land mid-migration.
export const migrateDatabase = sdk.setupOnInit(
  async (effects, kind, progress) => {
    if (!kind) return

    const postgresPassword = await storeJson
      .read((s) => s.postgresPassword)
      .once()
    if (!postgresPassword) throw new Error(i18n('store.json not found'))

    const pg = postgresSub(effects, 'init-postgres')
    const app = sdk.SubContainer.of(
      effects,
      { imageId: 'main' },
      sdk.Mounts.of(),
      'init-cal-diy',
    )
    const phase = progress.addPhase(i18n('Applying database migrations'), 1)

    await sdk.Daemons.of(effects)
      .addDaemon('postgres', {
        subcontainer: pg,
        exec: {
          command: sdk.useEntrypoint(['-c', 'listen_addresses=127.0.0.1']),
          env: postgresEnv(postgresPassword),
        },
        ready: {
          display: null,
          fn: async () =>
            (await pg.exec(pgIsReady)).exitCode === 0
              ? { result: 'success', message: null }
              : { result: 'starting', message: null },
        },
        requires: [],
      })
      .addOneshot('migrate', {
        subcontainer: app,
        exec: {
          fn: async () => {
            phase.start()
            await app.execFail(
              [
                'npx',
                'prisma',
                'migrate',
                'deploy',
                '--schema',
                '/calcom/packages/prisma/schema.prisma',
              ],
              {
                cwd: '/calcom',
                env: { DATABASE_URL: databaseUrl(postgresPassword) },
                timeout: null,
              },
            )
            phase.complete()
            return null
          },
        },
        requires: ['postgres'],
      })
      .runUntilSuccess(900_000)
  },
)
