import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:7',
  releaseNotes: {
    en_US:
      'While Cal.diy is starting, its Web Interface health check now says what it is doing — preparing web assets, applying database migrations with a count of how many are done, or registering apps. Booking reminder emails and workflow webhooks are now sent.',
    es_ES:
      'Mientras Cal.diy se inicia, la comprobación de estado de la interfaz web indica ahora qué está haciendo: preparando los recursos web, aplicando las migraciones de la base de datos con un recuento de las completadas, o registrando aplicaciones. Los correos de recordatorio de reservas y los webhooks de flujos de trabajo ahora se envían.',
    de_DE:
      'Während Cal.diy startet, zeigt die Zustandsprüfung der Weboberfläche jetzt an, was gerade passiert: Web-Assets werden vorbereitet, Datenbankmigrationen werden mit einem Zähler der bereits erledigten angewendet, oder Apps werden registriert. Buchungserinnerungs-E-Mails und Workflow-Webhooks werden jetzt versendet.',
    pl_PL:
      'Podczas uruchamiania Cal.diy kontrola stanu interfejsu webowego pokazuje teraz, co się dzieje: przygotowywanie zasobów webowych, stosowanie migracji bazy danych wraz z liczbą ukończonych lub rejestrowanie aplikacji. E-maile z przypomnieniami o rezerwacjach i webhooki workflow są teraz wysyłane.',
    fr_FR:
      "Pendant le démarrage de Cal.diy, la vérification d'état de l'interface web indique désormais ce qui est en cours : préparation des ressources web, application des migrations de la base de données avec le nombre déjà appliquées, ou enregistrement des applications. Les e-mails de rappel de réservation et les webhooks des flux de travail sont désormais envoyés.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
