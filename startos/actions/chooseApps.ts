import { T } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { listAppsSql, psql } from '../utils'

const { InputSpec, Value } = sdk

// Upstream's AppCategories, less the deprecated `video` and `web3`
const categories = {
  calendar: i18n('Calendars'),
  conferencing: i18n('Conferencing'),
  crm: i18n('CRM'),
  messaging: i18n('Messaging'),
  automation: i18n('Automation'),
  analytics: i18n('Analytics'),
  payment: i18n('Payments'),
  other: i18n('Other'),
}
type Category = keyof typeof categories

const category = (first: string): Category =>
  first === 'video'
    ? 'conferencing'
    : first in categories
      ? (first as Category)
      : 'other'

// Every section's options come from one query per form
const listings = new WeakMap<T.Effects, ReturnType<typeof listApps>>()

async function listApps(effects: T.Effects) {
  const store = await storeJson.read((s) => s).once()
  const rows = await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of(),
    'cal-list-apps',
    async (sub) =>
      String(
        (
          await sub.execFail([...psql, '-c', listAppsSql], {
            env: { PGPASSWORD: store?.postgresPassword ?? '' },
          })
        ).stdout,
      )
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [slug, first, enabled] = line.split('|')
          return { slug, category: category(first), enabled: enabled === 't' }
        }),
  )
  const selected = store?.enabledApps
  return rows.map((row) => ({
    ...row,
    selected: selected ? selected.includes(row.slug) : row.enabled,
  }))
}

const section = (id: Category) =>
  Value.object(
    { name: categories[id] },
    InputSpec.of({
      apps: Value.dynamicMultiselect(async ({ effects }) => {
        if (!listings.has(effects)) listings.set(effects, listApps(effects))
        const apps = (await listings.get(effects)!).filter(
          (app) => app.category === id,
        )

        if (!apps.length) {
          return {
            name: i18n('Apps'),
            default: [],
            values: { _none: i18n('No apps available') } as Record<
              string,
              string
            >,
            disabled: ['_none'],
          }
        }

        return {
          name: i18n('Apps'),
          default: apps.filter((app) => app.selected).map((app) => app.slug),
          values: Object.fromEntries(apps.map(({ slug }) => [slug, slug])),
        }
      }),
    }),
  )

const inputSpec = InputSpec.of({
  calendar: section('calendar'),
  conferencing: section('conferencing'),
  crm: section('crm'),
  messaging: section('messaging'),
  automation: section('automation'),
  analytics: section('analytics'),
  payment: section('payment'),
  other: section('other'),
})

export const chooseApps = sdk.Action.withInput(
  'choose-apps',

  async () => ({
    name: i18n('Choose Enabled Apps'),
    description: i18n(
      'Choose which apps Cal.diy offers in its app store, by category. Every other app is turned off. An app that needs provider credentials, such as Google Calendar or Zoom, still needs them before it can be connected. Stripe is managed by the "Configure Stripe Payments" action. Changing the selection restarts Cal.diy.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async () => null,

  async ({ effects, input }) =>
    storeJson.merge(effects, {
      enabledApps: Object.values(input).flatMap(({ apps }) =>
        apps.filter((slug) => slug !== '_none'),
      ),
    }),
)
