import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:9',
  releaseNotes: {
    en_US: 'Faster startup and safer password resets.',
    es_ES: 'Inicio más rápido y restablecimiento de contraseñas más seguro.',
    de_DE: 'Schnellerer Start und sichereres Zurücksetzen von Passwörtern.',
    pl_PL: 'Szybsze uruchamianie i bezpieczniejsze resetowanie haseł.',
    fr_FR:
      'Démarrage plus rapide et réinitialisation des mots de passe plus sûre.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
