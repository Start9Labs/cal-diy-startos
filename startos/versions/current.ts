import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:5',
  releaseNotes: {
    en_US:
      'Corrects the declared minimum memory requirement, which was recorded in the wrong unit and so was never actually enforced. StartOS now checks for the intended 2 GB of system memory before offering Cal.diy, keeping it off boxes too small to run it reliably.',
    es_ES:
      'Corrige el requisito mínimo de memoria declarado, que estaba registrado en la unidad equivocada y por tanto nunca se aplicaba realmente. StartOS ahora comprueba los 2 GB de memoria del sistema previstos antes de ofrecer Cal.diy, evitando equipos demasiado pequeños para ejecutarlo de forma fiable.',
    de_DE:
      'Korrigiert die angegebene Mindestspeicheranforderung, die in der falschen Einheit hinterlegt war und deshalb nie durchgesetzt wurde. StartOS prüft jetzt die vorgesehenen 2 GB Systemspeicher, bevor Cal.diy angeboten wird, und hält es von Geräten fern, die zu klein für einen zuverlässigen Betrieb sind.',
    pl_PL:
      'Poprawia zadeklarowane minimalne wymaganie pamięci, które zapisano w niewłaściwej jednostce i dlatego nigdy nie było egzekwowane. StartOS sprawdza teraz zakładane 2 GB pamięci systemowej przed zaoferowaniem Cal.diy, dzięki czemu nie trafia on na maszyny zbyt małe, by działał niezawodnie.',
    fr_FR:
      "Corrige l'exigence de mémoire minimale déclarée, qui était enregistrée dans la mauvaise unité et n'était donc jamais appliquée. StartOS vérifie désormais les 2 Go de mémoire système prévus avant de proposer Cal.diy, ce qui l'écarte des machines trop petites pour le faire fonctionner de manière fiable.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
