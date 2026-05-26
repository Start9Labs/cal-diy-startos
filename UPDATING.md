# Updating the upstream version

This package wraps Start9 Labs' own [hello-world](https://github.com/Start9Labs/hello-world) source, which we build and publish ourselves as `ghcr.io/start9labs/hello-world`. "Upstream" here means that source repo, not the image namespace.

## Determining the upstream version

- **hello-world** ([Start9Labs/hello-world](https://github.com/Start9Labs/hello-world)) — fetch the latest release tag:

  ```sh
  gh release view -R Start9Labs/hello-world --json tagName -q .tagName
  ```

  The current pin lives in `startos/manifest/index.ts` at `images['hello-world'].source.dockerTag` (the version after the `:` in `ghcr.io/start9labs/hello-world:<version>`).

## Applying the bump

- Bump `dockerTag` in `startos/manifest/index.ts` to `ghcr.io/start9labs/hello-world:<new version>` (drop the leading `v` from the release tag).
