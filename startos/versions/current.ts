import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '6.2.0:6',
  releaseNotes: {
    en_US:
      'Restores installs and updates on 2 GB machines. The previous release corrected the memory requirement into bytes but wrote it as a literal 2 GiB, and StartOS measures the memory the operating system can see, which is always a few hundred MiB below the capacity a machine is sold with. A 2 GB machine therefore failed the minimum it was meant to meet, and Cal.diy stopped appearing in the marketplace. The requirement now sits between the 1 and 2 GB sizes.',
    es_ES:
      'Restaura la instalación y las actualizaciones en máquinas de 2 GB. La versión anterior corrigió el requisito de memoria a bytes, pero lo escribió como 2 GiB exactos, y StartOS mide la memoria que el sistema operativo puede ver, que siempre queda unos cientos de MiB por debajo de la capacidad con la que se vende una máquina. Así que una máquina de 2 GB no cumplía el mínimo que debía cumplir y Cal.diy dejaba de aparecer en el mercado. El requisito se sitúa ahora entre los tamaños de 1 y 2 GB.',
    de_DE:
      'Stellt Installation und Updates auf 2-GB-Geräten wieder her. Die vorige Version stellte die Speicheranforderung auf Bytes um, hinterlegte sie aber als exakte 2 GiB, und StartOS misst den Speicher, den das Betriebssystem sehen kann – und der liegt stets einige hundert MiB unter der verkauften Kapazität. Ein 2-GB-Gerät verfehlte damit das Minimum, das es erfüllen sollte, und Cal.diy erschien nicht mehr im Marktplatz. Die Anforderung liegt jetzt zwischen den Größen 1 und 2 GB.',
    pl_PL:
      'Przywraca instalację i aktualizacje na maszynach z 2 GB. Poprzednie wydanie poprawiło wymaganie pamięci na bajty, ale zapisało je jako dokładne 2 GiB, a StartOS mierzy pamięć widzianą przez system operacyjny, która zawsze jest o kilkaset MiB mniejsza niż pojemność, z jaką sprzedawana jest maszyna. Maszyna z 2 GB nie spełniała więc minimum, które miała spełniać, a Cal.diy przestawał pojawiać się w sklepie. Wymaganie mieści się teraz między rozmiarami 1 i 2 GB.',
    fr_FR:
      "Rétablit l'installation et les mises à jour sur les machines de 2 Go. La version précédente a converti l'exigence de mémoire en octets mais l'a écrite comme 2 Gio exacts, alors que StartOS mesure la mémoire visible par le système d'exploitation, toujours inférieure de quelques centaines de Mio à la capacité annoncée d'une machine. Une machine de 2 Go échouait donc au minimum qu'elle était censée atteindre et Cal.diy cessait d'apparaître dans la marketplace. L'exigence se situe désormais entre les tailles de 1 et 2 Go.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
