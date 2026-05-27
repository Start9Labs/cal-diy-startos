# syntax=docker/dockerfile:1
#
# Upstream publishes amd64 and arm64 as separate tags (`v6.2.0` vs
# `v6.2.0-arm`) rather than a multi-arch manifest list, so we can't pull
# the image directly via `dockerTag`. This thin Dockerfile selects the
# right base tag per target architecture; start-cli sets `TARGETARCH`
# from `--platform=linux/<arch>` when packing a single-arch s9pk.

ARG CAL_IMAGE=calcom/cal.com
ARG CAL_VERSION=v6.2.0

FROM ${CAL_IMAGE}:${CAL_VERSION} AS base-amd64
FROM ${CAL_IMAGE}:${CAL_VERSION}-arm AS base-arm64

ARG TARGETARCH
FROM base-${TARGETARCH} AS final
