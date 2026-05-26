import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:0',
  releaseNotes: {
    en_US: 'Initial Cal.diy release for StartOS.',
    es_ES: 'Versión inicial de Cal.diy para StartOS.',
    de_DE: 'Erste Cal.diy-Veröffentlichung für StartOS.',
    pl_PL: 'Pierwsze wydanie Cal.diy dla StartOS.',
    fr_FR: 'Première version de Cal.diy pour StartOS.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
