# Tiny sidecar image used to run scheduled jobs against Cal.diy's
# /api/cron/* and /api/tasks/* endpoints. alpine's busybox already
# ships crond; we just need curl to fire the HTTP requests.
FROM alpine:3.20
RUN apk add --no-cache curl
