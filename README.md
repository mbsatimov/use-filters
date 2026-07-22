# use-filters

Monorepo for **[@mbsatimov/use-filters](./packages/use-filters)** — headless, URL-synced filter state for React. Declare filters once, get typed params, resolved filter state, and nuqs-backed URL sync back — bring your own UI.

- 📦 **[`packages/use-filters`](./packages/use-filters)** — the published library ([README](./packages/use-filters/README.md))
- 📚 **[`packages/docs`](./packages/docs)** — the documentation site ([use-filters.vercel.app](https://use-filters.vercel.app))

## Development

```bash
npm install          # install all workspaces
npm run build        # build the library
npm test             # run the library test suite
npm run typecheck    # type-check the library
npm run docs         # run the docs site locally
```

Releases are automated with [Changesets](https://github.com/changesets/changesets): add a changeset with `npm run changeset`, and merging the generated "Version Packages" PR publishes to npm.

## License

[MIT](./LICENSE)
