import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, List, Value } = sdk

export const inputSpec = InputSpec.of({
  domains: Value.list(
    List.text(
      {
        name: i18n('Domains'),
        description: i18n(
          'An organizer whose email address is at one of these domains appears with that address in calendar invites.',
        ),
        default: [],
      },
      {
        placeholder: 'example.com',
        patterns: [
          {
            regex: '^[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$',
            description: 'A domain name, such as example.com.',
          },
        ],
      },
    ),
  ),
})

export const inviteOrganizerDomains = sdk.Action.withInput(
  'invite-organizer-domains',

  async ({ effects }) => ({
    name: i18n('Show Organizer in Invites'),
    description: i18n(
      'When an event type has "Hide organizer\'s email" on, Cal.diy lists the organizer in calendar invites as no-reply@cal.com, so the organizer\'s own calendar asks them to accept their own meeting. For organizers at the domains listed here, invites carry their real address instead. Confirmation emails still hide it. Saving restarts Cal.diy.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    domains:
      (await storeJson.read((s) => s.organizerEmailExemptDomains).once()) ?? [],
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, {
      organizerEmailExemptDomains: input.domains.map((d) => d.toLowerCase()),
    }),
)
