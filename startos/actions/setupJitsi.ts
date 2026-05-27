import { T } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { postgresDb, postgresUser } from '../utils'

const { InputSpec, Value } = sdk

async function getJitsiUrls(effects: T.Effects): Promise<string[]> {
  const remote = await sdk.serviceInterface
    .get(effects, { id: 'ui', packageId: 'jitsi' })
    .const()
  return remote?.addressInfo?.nonLocal.format() ?? []
}

export const inputSpec = InputSpec.of({
  jitsiHost: Value.dynamicSelect(async ({ effects }) => {
    const urls = await getJitsiUrls(effects)
    return {
      name: i18n('Jitsi URL'),
      description:
        urls.length === 0
          ? i18n(
              'No Jitsi URLs available — install the Jitsi package from the StartOS marketplace and start it first.',
            )
          : i18n(
              'Which Jitsi URL Cal.diy should use when generating meeting links. Pick the URL bookers will click — usually a custom domain or .local, not the LAN IP.',
            ),
      values: urls.reduce(
        (obj, url) => ({ ...obj, [url]: url }),
        {} as Record<string, string>,
      ),
      default: '',
    }
  }),
})

export const setupJitsi = sdk.Action.withInput(
  'setup-jitsi',

  async ({ effects }) => ({
    name: i18n('Set Up Self-Hosted Jitsi'),
    description: i18n(
      'Configure Cal.diy to use a locally-installed Jitsi Meet instance as the video provider. Requires the Jitsi package from the StartOS marketplace. Once configured, Cal.diy will route bookings whose event types choose "Jitsi Video" through your local Jitsi server instead of the public meet.jit.si default.',
    ),
    warning: i18n(
      "Run this only after installing and starting Jitsi. If you change the Jitsi URL later (or uninstall Jitsi), re-run this action with the new URL or pre-existing booking links will be broken. The same URL-change side effects that apply to Cal.diy's primary URL apply here.",
    ),
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    // Pre-fill from the current Jitsi host stored in cal's App.keys, but only
    // if it's still one of the URLs jitsi-startos currently exposes.
    const urls = await getJitsiUrls(effects)
    const postgresPassword = await storeJson
      .read((s) => s.postgresPassword)
      .once()
    if (!postgresPassword) return { jitsiHost: undefined }
    let current = ''
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'postgres' },
      sdk.Mounts.of(),
      'cal-jitsi-prefill',
      async (sub) => {
        const result = await sub.execFail([
          'sh',
          '-c',
          `PGPASSWORD='${postgresPassword}' psql -h 127.0.0.1 -U ${postgresUser} -d ${postgresDb} -At -v ON_ERROR_STOP=1 -c "SELECT keys->>'jitsiHost' FROM \\"App\\" WHERE slug = 'jitsi';"`,
        ])
        current = (result.stdout as string).trim()
      },
    )
    return {
      jitsiHost: urls.includes(current) ? current : undefined,
    }
  },

  async ({ effects, input }) => {
    const urls = await getJitsiUrls(effects)
    if (!urls.includes(input.jitsiHost)) {
      throw new Error(
        i18n(
          'Selected Jitsi URL is no longer available. Ensure Jitsi is installed and running, then re-run this action.',
        ),
      )
    }

    const postgresPassword = await storeJson
      .read((s) => s.postgresPassword)
      .once()
    if (!postgresPassword) {
      throw new Error(i18n('Database password not found in store.json'))
    }

    // The Jitsi App row is seeded by cal's app-store sync on startup; we just
    // update its keys + enable it. Returning the slug lets us detect the
    // (rare) case where the row hasn't synced yet so we can give a clean error
    // rather than silently no-op.
    const safeHost = input.jitsiHost.replace(/'/g, "''")
    let updatedSlug = ''
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'postgres' },
      sdk.Mounts.of(),
      'cal-jitsi-apply',
      async (sub) => {
        const result = await sub.execFail([
          'sh',
          '-c',
          `PGPASSWORD='${postgresPassword}' psql -h 127.0.0.1 -U ${postgresUser} -d ${postgresDb} -At -v ON_ERROR_STOP=1 <<'SQL_EOF'
UPDATE "App"
SET keys = jsonb_build_object('jitsiHost', '${safeHost}', 'jitsiPathPattern', '{uuid}'),
    enabled = true,
    "updatedAt" = NOW()
WHERE slug = 'jitsi'
RETURNING slug;
SQL_EOF`,
        ])
        updatedSlug = (result.stdout as string).trim()
      },
    )

    if (!updatedSlug) {
      throw new Error(
        i18n(
          'Cal.diy has not synced the Jitsi app row yet. Wait a minute for the app-store sync to complete after first boot, then re-run.',
        ),
      )
    }

    return {
      version: '1',
      title: i18n('Jitsi configured'),
      message: i18n(
        'Cal.diy will now use ${url} for Jitsi meeting links. Create or edit an event type and pick "Jitsi Video" under Location to use it.',
        { url: input.jitsiHost },
      ),
      result: null,
    }
  },
)
