import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:13',
  releaseNotes: {
    en_US:
      'New installs start with every Cal.diy app turned off. A new Choose Enabled Apps action picks which apps are available, and the choice holds across restarts.',
    es_ES:
      'Las instalaciones nuevas empiezan con todas las aplicaciones de Cal.diy desactivadas. Una nueva acción, Elegir aplicaciones habilitadas, decide qué aplicaciones están disponibles, y la elección se mantiene tras los reinicios.',
    de_DE:
      'Neue Installationen starten mit allen Cal.diy-Apps deaktiviert. Eine neue Aktion „Aktivierte Apps auswählen“ legt fest, welche Apps verfügbar sind, und die Auswahl bleibt über Neustarts hinweg erhalten.',
    pl_PL:
      'Nowe instalacje zaczynają z wyłączonymi wszystkimi aplikacjami Cal.diy. Nowa akcja „Wybierz włączone aplikacje” określa, które aplikacje są dostępne, a wybór zostaje zachowany po ponownym uruchomieniu.',
    fr_FR:
      'Les nouvelles installations démarrent avec toutes les applications de Cal.diy désactivées. Une nouvelle action, Choisir les applications activées, détermine les applications disponibles, et ce choix est conservé après un redémarrage.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
