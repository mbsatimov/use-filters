---
'@mbsatimov/use-filters': minor
---

### Added

- **`listeners`** on `useFilters` options — declarative side-effect hooks, à la
  TanStack Form. `onParamsChange` fires (in an effect) whenever the committed
  `params` change, with the new params, the previous params, what triggered the
  change, and the whole hook API:

  ```ts
  useFilters(configs, {
    listeners: {
      onParamsChange: ({ params, prev, cause, api }) => {
        if (cause === 'reset') void api.post?.('/reset-event', params);
      }
    }
  });
  ```

  `cause` is `'change' | 'reset' | 'external'` (`'external'` = a back/forward
  navigation, another URL consumer, or a pagination write you own). `params`,
  `prev`, and `api` are fully typed from your config. It fires only on
  **committed** changes — never on mount, on a draft edit before commit, or when
  a change resolves to the same value. Exports the `UseFiltersListeners`,
  `ParamsChangeContext`, and `ParamsChangeCause` types.
