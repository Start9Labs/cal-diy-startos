import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:2',
  releaseNotes: {
    en_US:
      'Adds a "Configure Stripe Payments" action to set up Stripe from the StartOS interface — no more editing .env by hand — so calendar owners can accept payment for paid bookings.',
    es_ES:
      'Añade una acción "Configurar pagos con Stripe" para configurar Stripe desde la interfaz de StartOS —sin editar .env a mano— para que los propietarios de calendarios puedan cobrar por las reservas de pago.',
    de_DE:
      'Fügt eine Aktion „Stripe-Zahlungen konfigurieren" hinzu, um Stripe über die StartOS-Oberfläche einzurichten — ohne die .env von Hand zu bearbeiten — damit Kalenderinhaber Zahlungen für kostenpflichtige Buchungen annehmen können.',
    pl_PL:
      'Dodaje akcję „Konfiguruj płatności Stripe", aby skonfigurować Stripe z poziomu interfejsu StartOS — bez ręcznej edycji pliku .env — dzięki czemu właściciele kalendarzy mogą przyjmować płatności za płatne rezerwacje.',
    fr_FR:
      "Ajoute une action « Configurer les paiements Stripe » pour configurer Stripe depuis l'interface StartOS — sans modifier le fichier .env à la main — afin que les propriétaires de calendriers puissent accepter les paiements pour les réservations payantes.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
