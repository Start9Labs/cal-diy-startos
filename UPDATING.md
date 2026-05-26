# Updating the upstream version

This package wraps the upstream image **`calcom/cal.com`** on Docker Hub, which is the actual artifact published by [calcom/cal.diy](https://github.com/calcom/cal.diy) (the rebranded community fork of Cal.com — same codebase, same image namespace).

## Determining the upstream version

Fetch the latest release tag:

```sh
gh release view -R calcom/cal.diy --json tagName -q .tagName
```

Verify both architecture-specific tags exist on Docker Hub before bumping:

```sh
curl -s "https://hub.docker.com/v2/repositories/calcom/cal.com/tags/<new-version>/" | jq '.images[].architecture'
curl -s "https://hub.docker.com/v2/repositories/calcom/cal.com/tags/<new-version>-arm/" | jq '.images[].architecture'
```

(Upstream publishes amd64 and arm64 as separate tags — `vX.Y.Z` and `vX.Y.Z-arm` — rather than a multi-arch manifest list. The thin `Dockerfile` in this repo selects the right tag per target architecture at pack time.)

## Applying the bump

- Update `calVersion` in `startos/manifest/index.ts` (e.g. `v6.2.0` → `v6.3.0`).
- Update `version` and `releaseNotes` in `startos/versions/current.ts`.
- For major bumps, read the upstream release notes for breaking changes (especially around Prisma migrations and any newly required env vars) and update `startos/main.ts` if necessary.
