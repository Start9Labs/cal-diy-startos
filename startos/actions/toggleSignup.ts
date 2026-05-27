import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

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
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  // Flip the bool in store.json. The web daemon reads it reactively via
  // .const(effects) and restarts with NEXT_PUBLIC_DISABLE_SIGNUP updated.
  // No SQL needed: cal's signup gate is
  //   `process.env.NEXT_PUBLIC_DISABLE_SIGNUP === "true" || dbFeatureFlag`
  // and the env half of the OR is sufficient. The DB Feature row stays at
  // its upstream-seeded `enabled: false`, which only matters when the env
  // half is false — which is precisely the "signups enabled" state, where
  // we don't want the DB flag to block. Touching the DB would only force
  // `allowedStatuses: 'only-running'` for no real gain.
  async ({ effects }) => {
    const disabled = await storeJson
      .read((s) => s.signupDisabled)
      .const(effects)
    await storeJson.merge(effects, { signupDisabled: !disabled })
  },
)
