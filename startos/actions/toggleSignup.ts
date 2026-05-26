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
            'Most self-hosted instances should NOT enable open signups. Anyone who can reach this Cal.diy URL will be able to create an account. If you just need to add a few users you trust, leave signups disabled and add them from the Cal.diy admin console (Settings → Admin → Users → Add) instead — the new user signs in via the Forgot Password flow if SMTP is configured, or you can run the "Reset User Password" action here to mint their initial password and share it out-of-band. Only enable open signups if you specifically want strangers to self-register.',
          )
        : i18n(
            'After disabling, add new users from the Cal.diy admin console (Settings → Admin → Users → Add). The new user signs in via Forgot Password (SMTP required) or you can use the "Reset User Password" action here to mint their first password. A vestigial "Create Account" link will still render in the login page footer — it is baked into the static JavaScript bundle at upstream build time — but clicking it redirects to a "Signup is disabled" error page. Server-side enforcement is in effect.',
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
