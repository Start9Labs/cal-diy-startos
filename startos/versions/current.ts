import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:12',
  releaseNotes: {
    en_US:
      'Install and update now prepare the database before Cal.diy starts, so settings can be changed safely while it starts.',
    es_ES:
      'La instalación y la actualización ahora preparan la base de datos antes de que Cal.diy se inicie, por lo que la configuración puede cambiarse con seguridad mientras arranca.',
    de_DE:
      'Installation und Update bereiten die Datenbank jetzt vor, bevor Cal.diy startet, sodass Einstellungen während des Starts gefahrlos geändert werden können.',
    pl_PL:
      'Instalacja i aktualizacja przygotowują teraz bazę danych przed uruchomieniem Cal.diy, więc ustawienia można bezpiecznie zmieniać podczas jego uruchamiania.',
    fr_FR:
      'L’installation et la mise à jour préparent désormais la base de données avant le démarrage de Cal.diy, ce qui permet de modifier les paramètres sans risque pendant son démarrage.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
