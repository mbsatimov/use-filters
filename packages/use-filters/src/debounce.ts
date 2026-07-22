/** Default debounce for an async filter's `loadOptions`, when `searchDebounceMs` isn't set. */
export const DEFAULT_ASYNC_DEBOUNCE_MS = 300;

/**
 * Debounce an async function: calls within `ms` collapse into one real call to
 * `fn` (the *last* call's args), and every caller in that window resolves/rejects
 * together with that call's outcome. Used for async filters' `loadOptions`.
 */
export const debounceAsync = <Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  ms: number
): ((...args: Args) => Promise<R>) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waiting: { reject: (reason: unknown) => void; resolve: (value: R) => void }[] = [];

  return (...args: Args) =>
    new Promise<R>((resolve, reject) => {
      waiting.push({ reject, resolve });
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        const callers = waiting;
        waiting = [];
        fn(...args).then(
          (result) => {
            for (const caller of callers) caller.resolve(result);
          },
          (error: unknown) => {
            for (const caller of callers) caller.reject(error);
          }
        );
      }, ms);
    });
};
