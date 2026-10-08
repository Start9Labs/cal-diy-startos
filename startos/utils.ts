export const uiPort = 3000
export const postgresPort = 5432
export const postgresUser = 'calcom'
export const postgresDb = 'calendso'

// Host id (the `sdk.MultiHost.of` group) vs. the interface id exported on it —
// they differ here, and `setupPrimaryUrl` needs both.
export const uiHostId = 'ui-multi'
export const uiInterfaceId = 'ui'

// Hardcoded in the upstream calcom/cal.com:v6.2.0 image at build time.
// Cal's start.sh runs replace-placeholder.sh to rewrite static .next/ assets
// from this value to whatever NEXT_PUBLIC_WEBAPP_URL is set at runtime.
export const builtWebappUrl = 'http://localhost:3000'
