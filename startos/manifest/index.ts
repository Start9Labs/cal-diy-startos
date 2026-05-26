import { setupManifest } from '@start9labs/start-sdk'
import { alertUninstall, long, short } from './i18n'

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
  },
  alerts: {
    install: null,
    update: null,
    uninstall: alertUninstall,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
