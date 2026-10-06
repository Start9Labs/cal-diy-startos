import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:8',
  releaseNotes: {
    en_US: `While Cal.diy is starting, its Web Interface health check now says what it is doing — preparing web assets, applying database migrations with a count of how many are done, or registering apps. Booking reminder emails and workflow webhooks are now sent.

- Open UI opens Cal.diy at its primary URL.
- Cal.diy keeps its primary URL when that address moves to another port.
- Configure Stripe Payments explains its Disabled and Enabled options.
- Disable Signups' confirmation says that new accounts can no longer be created.`,
    es_ES: `Mientras Cal.diy se inicia, la comprobación de estado de la interfaz web indica ahora qué está haciendo: preparando los recursos web, aplicando las migraciones de la base de datos con un recuento de las completadas, o registrando aplicaciones. Los correos de recordatorio de reservas y los webhooks de flujos de trabajo ahora se envían.

- Abrir interfaz abre Cal.diy en su URL principal.
- Cal.diy conserva su URL principal cuando esa dirección pasa a otro puerto.
- Configurar pagos con Stripe explica sus opciones Desactivado y Activado.
- La confirmación de Deshabilitar registros indica que ya no se podrán crear cuentas nuevas.`,
    de_DE: `Während Cal.diy startet, zeigt die Zustandsprüfung der Weboberfläche jetzt an, was gerade passiert: Web-Assets werden vorbereitet, Datenbankmigrationen werden mit einem Zähler der bereits erledigten angewendet, oder Apps werden registriert. Buchungserinnerungs-E-Mails und Workflow-Webhooks werden jetzt versendet.

- „Oberfläche öffnen“ öffnet Cal.diy unter seiner primären URL.
- Cal.diy behält seine primäre URL, wenn diese Adresse auf einen anderen Port wechselt.
- „Stripe-Zahlungen konfigurieren“ erklärt die Optionen Deaktiviert und Aktiviert.
- Die Bestätigung von „Anmeldungen deaktivieren“ weist darauf hin, dass keine neuen Konten mehr erstellt werden können.`,
    pl_PL: `Podczas uruchamiania Cal.diy kontrola stanu interfejsu webowego pokazuje teraz, co się dzieje: przygotowywanie zasobów webowych, stosowanie migracji bazy danych wraz z liczbą ukończonych lub rejestrowanie aplikacji. E-maile z przypomnieniami o rezerwacjach i webhooki workflow są teraz wysyłane.

- „Otwórz interfejs” otwiera Cal.diy pod jego głównym adresem URL.
- Cal.diy zachowuje swój główny URL, gdy ten adres przejdzie na inny port.
- „Konfiguruj płatności Stripe” objaśnia opcje Wyłączone i Włączone.
- Potwierdzenie „Wyłącz rejestracje” informuje, że nie będzie można już tworzyć nowych kont.`,
    fr_FR: `Pendant le démarrage de Cal.diy, la vérification d'état de l'interface web indique désormais ce qui est en cours : préparation des ressources web, application des migrations de la base de données avec le nombre déjà appliquées, ou enregistrement des applications. Les e-mails de rappel de réservation et les webhooks des flux de travail sont désormais envoyés.

- Ouvrir l'interface ouvre Cal.diy à son URL principale.
- Cal.diy conserve son URL principale lorsque cette adresse passe sur un autre port.
- Configurer les paiements Stripe explique ses options Désactivé et Activé.
- La confirmation de Désactiver les inscriptions indique qu'il ne sera plus possible de créer de nouveaux comptes.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
