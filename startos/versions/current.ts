import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:14',
  releaseNotes: {
    en_US:
      "A new Show Organizer in Invites action lists the email domains whose organizers appear in calendar invites under their real address, even on event types that hide the organizer's email.",
    es_ES:
      'Una nueva acción, Mostrar organizador en invitaciones, indica los dominios de correo cuyos organizadores aparecen en las invitaciones de calendario con su dirección real, incluso en los tipos de evento que ocultan el correo del organizador.',
    de_DE:
      'Eine neue Aktion „Organisator in Einladungen anzeigen“ legt die E-Mail-Domains fest, deren Organisatoren in Kalendereinladungen mit ihrer echten Adresse erscheinen, auch bei Ereignistypen, die die E-Mail des Organisators ausblenden.',
    pl_PL:
      'Nowa akcja „Pokaż organizatora w zaproszeniach” określa domeny e-mail, których organizatorzy występują w zaproszeniach kalendarza pod prawdziwym adresem, także w typach wydarzeń ukrywających e-mail organizatora.',
    fr_FR:
      'Une nouvelle action, Afficher l’organisateur dans les invitations, liste les domaines de messagerie dont les organisateurs apparaissent dans les invitations d’agenda sous leur véritable adresse, même pour les types d’événements qui masquent l’e-mail de l’organisateur.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
