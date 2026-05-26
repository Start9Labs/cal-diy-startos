import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { postgresDb, postgresUser } from '../utils'

export const toggleSignup = sdk.Action.withoutInput(
  'toggle-signup',

  async ({ effects }) => {
    const disabled = await storeJson
      .read((s) => s.signupDisabled)
      .const(effects)

    return {
      name: disabled ? i18n('Enable Signups') : i18n('Disable Signups'),
      description: disabled
        ? i18n(
            'Signups are currently disabled. Run this action to allow new account creation on your Cal.diy instance.',
          )
        : i18n(
            'Signups are currently enabled. Run this action to prevent new account creation. Existing users are unaffected; only new signups are blocked.',
          ),
      warning: disabled
        ? i18n(
            'Anyone who can reach this Cal.diy instance will be able to create an account. Only re-enable if you intend to invite new users.',
          )
        : i18n(
            'A vestigial "Create Account" link will still render in the login page footer (it is baked into the static JavaScript bundle at upstream build time), but clicking it redirects to a "Signup is disabled" error page. Server-side enforcement is in effect.',
          ),
      allowedStatuses: 'only-running',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const disabled = await storeJson
      .read((s) => s.signupDisabled)
      .const(effects)
    const next = !disabled

    const postgresPassword = await storeJson
      .read((s) => s.postgresPassword)
      .once()
    if (!postgresPassword) {
      throw new Error(i18n('Database password not found in store.json'))
    }

    const sql = `INSERT INTO "Feature" (slug, enabled, description, "type", "createdAt", "updatedAt")
VALUES ('disable-signup', ${next}, 'Enable to prevent users from signing up', 'OPERATIONAL', NOW(), NOW())
ON CONFLICT (slug) DO UPDATE SET enabled = EXCLUDED.enabled, "updatedAt" = NOW();`

    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'postgres' },
      sdk.Mounts.of(),
      'cal-toggle-signup',
      async (sub) => {
        await sub.execFail([
          'sh',
          '-c',
          `PGPASSWORD='${postgresPassword}' psql -h 127.0.0.1 -U ${postgresUser} -d ${postgresDb} -v ON_ERROR_STOP=1 <<'SQL_EOF'
${sql}
SQL_EOF`,
        ])
      },
    )

    await storeJson.merge(effects, { signupDisabled: next })
  },
)
