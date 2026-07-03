import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

const calVersion = 'v6.2.0'
const calImage = 'calcom/cal.com'

export const manifest = setupManifest({
  id: 'cal-diy',
  title: 'Cal.diy',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9Labs/cal-diy-startos',
  upstreamRepo: 'https://github.com/calcom/cal.diy',
  marketingUrl: 'https://cal.diy/',
  donationUrl: null,
  description: { short, long },
  volumes: ['startos', 'db'],
  images: {
    main: {
      source: {
        dockerBuild: {
          buildArgs: {
            CAL_IMAGE: calImage,
            CAL_VERSION: calVersion,
          },
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
    postgres: {
      source: {
        dockerTag: 'postgres:16-alpine',
      },
      arch: ['x86_64', 'aarch64'],
    },
    cron: {
      source: {
        dockerBuild: {
          dockerfile: './cron.Dockerfile',
        },
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  hardwareRequirements: {
    // Cal.diy's web daemon idles ~750 MB and PostgreSQL adds ~200 MB. Sub-2 GB
    // boxes OOM during peak load (booking page renders + Prisma queries).
    ram: 2048,
  },
  dependencies: {},
})
