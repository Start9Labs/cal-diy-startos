import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { postgresDb, postgresUser } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  email: Value.text({
    name: i18n('Email'),
    description: i18n(
      'The email address of the Cal.diy user whose password to reset.',
    ),
    required: true,
    default: null,
    placeholder: 'you@example.com',
    inputmode: 'email',
    patterns: [
      {
        regex: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
        description: 'Must be a valid email address.',
      },
    ],
    masked: false,
  }),
})

export const resetPassword = sdk.Action.withInput(
  'reset-password',

  async ({ effects }) => ({
    name: i18n('Reset User Password'),
    description: i18n(
      'Generate a new random password for the Cal.diy user with the given email and store it directly in the database. Useful if a user has lost their password and SMTP-based recovery is unavailable.',
    ),
    warning: i18n(
      'Use only for accounts that authenticate via password. Users who sign in exclusively via OAuth (Google, Microsoft, etc.) do not have a stored password and resetting it here will have no effect.',
    ),
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async () => ({ email: undefined }),

  async ({ effects, input }) => {
    const newPassword = utils.getDefaultString({
      charset: 'a-z,A-Z,1-9',
      len: 22,
    })

    let hash = ''
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'main' },
      sdk.Mounts.of(),
      'cal-hash-password',
      async (sub) => {
        const result = await sub.execFail(
          [
            'node',
            '-e',
            `console.log(require('bcryptjs').hashSync(${JSON.stringify(newPassword)}, 12))`,
          ],
          { cwd: '/calcom' },
        )
        hash = (result.stdout as string).trim()
      },
    )
    if (!hash.startsWith('$2')) {
      throw new Error(i18n('Password hashing failed'))
    }

    const postgresPassword = await storeJson
      .read((s) => s.postgresPassword)
      .once()
    if (!postgresPassword) {
      throw new Error(i18n('Database password not found in store.json'))
    }

    const safeEmail = input.email.replace(/'/g, "''")
    const safeHash = hash.replace(/'/g, "''")

    const sql = `\\set ON_ERROR_STOP 1
WITH target AS (SELECT id FROM "User" WHERE email = '${safeEmail}' LIMIT 1)
INSERT INTO "UserPassword" (hash, "userId")
SELECT '${safeHash}', id FROM target
ON CONFLICT ("userId") DO UPDATE SET hash = EXCLUDED.hash
RETURNING "userId";`

    let updatedUserId = ''
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'postgres' },
      sdk.Mounts.of(),
      'cal-reset-password',
      async (sub) => {
        const result = await sub.execFail([
          'sh',
          '-c',
          `PGPASSWORD='${postgresPassword}' psql -h 127.0.0.1 -U ${postgresUser} -d ${postgresDb} -At -v ON_ERROR_STOP=1 <<'SQL_EOF'
${sql}
SQL_EOF`,
        ])
        updatedUserId = (result.stdout as string).trim()
      },
    )

    if (!updatedUserId) {
      throw new Error(
        i18n('No Cal.diy user found with email ${email}', {
          email: input.email,
        }),
      )
    }

    return {
      version: '1',
      title: i18n('Password Reset'),
      message: i18n(
        'The password for ${email} has been reset. Use the new password below to log in.',
        { email: input.email },
      ),
      result: {
        type: 'single' as const,
        name: i18n('New Password'),
        value: newPassword,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
