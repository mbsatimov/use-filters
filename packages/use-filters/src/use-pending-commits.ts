import * as React from 'react';

import type { CommittedValue, ScheduledChange } from './resolved-fields';
import type { ParamsChangeCause, ParamValue } from './types';

import { valuesEqual } from './filter-utils';
import { readCommitted } from './resolved-fields';

/**
 * A change held in local state while its `commit` mode delays the URL write.
 * `value`/`labels` are what the filter shows now; `commit()` is the deferred write.
 */
export interface PendingChange extends CommittedValue {
  commit: () => void;
}

/** Writes a filter's value (and label sidecar) straight to the URL. */
type WriteValue = (key: string, value: ParamValue, labels?: string | string[] | null) => void;

/**
 * The draft layer, as a self-contained state machine: non-`instant` changes are
 * held here — with their debounce timers — until their commit mode fires, then
 * written through `writeValue`.
 *
 * The pending map and the timers are owned entirely by this hook; `useFilters`
 * only reads `pending` (to overlay drafts onto committed values) and calls the
 * operations below. `causeRef` is the caller's, so a commit reports the action
 * that triggered it to `onParamsChange`.
 */
export function usePendingCommits(
  values: Record<string, unknown>,
  writeValue: WriteValue,
  causeRef: React.RefObject<ParamsChangeCause>
) {
  const [pending, setPending] = React.useState<Record<string, PendingChange>>({});
  const timersRef = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearTimer = React.useCallback((key: string) => {
    const timer = timersRef.current[key];
    if (timer !== undefined) {
      clearTimeout(timer);
      delete timersRef.current[key];
    }
  }, []);

  const dropPending = React.useCallback((key: string) => {
    setPending((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  // Cancel in-flight timers on unmount so they can't write to a torn-down component.
  React.useEffect(
    () => () => {
      for (const timer of Object.values(timersRef.current)) clearTimeout(timer);
    },
    []
  );

  // Single-key apply/cancel — shared by the whole-set and per-filter versions.
  const applyKey = React.useCallback(
    (key: string) => {
      const change = pending[key];
      if (!change) return;
      clearTimer(key);
      // A staged change committing is still a value change.
      causeRef.current = 'change';
      change.commit();
      dropPending(key);
    },
    [pending, clearTimer, dropPending, causeRef]
  );

  const cancelKey = React.useCallback(
    (key: string) => {
      if (!(key in pending)) return;
      clearTimer(key);
      dropPending(key);
    },
    [pending, clearTimer, dropPending]
  );

  // Bypass the draft layer entirely: drop any pending change/timer for the key
  // and write to the URL now. Backs both `setFilter` and `instantReset`.
  const commitNow = React.useCallback(
    (key: string, value: ParamValue, cause: ParamsChangeCause) => {
      clearTimer(key);
      dropPending(key);
      causeRef.current = cause;
      writeValue(key, value);
    },
    [clearTimer, dropPending, writeValue, causeRef]
  );

  // Route a change through its filter's `commit` mode. `instant` writes to the
  // URL immediately; `debounce` shows it right away but delays the write and
  // resets the timer on each call; `manual` shows it and waits for `apply()`.
  const schedule = React.useCallback(
    ({ cause = 'change', key, labels = null, mode, value }: ScheduledChange) => {
      clearTimer(key);
      const commit = () => writeValue(key, value, labels);
      if (mode === 'instant') {
        causeRef.current = cause;
        dropPending(key);
        commit();
        return;
      }
      // No-op guard: a change matching the committed value drops the draft
      // instead of going dirty (compares committed, not pending, so undoing clears isDirty).
      const committed = readCommitted(values, key);
      if (valuesEqual(value, committed.value) && valuesEqual(labels, committed.labels)) {
        dropPending(key);
        return;
      }
      setPending((current) => ({ ...current, [key]: { commit, labels, value } }));
      if (mode === 'manual') return;
      timersRef.current[key] = setTimeout(() => {
        // Set the cause at commit time (not when scheduled) so a debounced
        // write reports its own cause even if other actions ran while it waited.
        causeRef.current = cause;
        delete timersRef.current[key];
        dropPending(key);
        commit();
      }, mode.debounce);
    },
    [clearTimer, dropPending, writeValue, values, causeRef]
  );

  // Drop every draft and timer at once, without writing — `instantReset` does
  // its own batched URL write afterwards.
  const discardAll = React.useCallback(() => {
    for (const timer of Object.values(timersRef.current)) clearTimeout(timer);
    timersRef.current = {};
    setPending({});
  }, []);

  return { applyKey, cancelKey, commitNow, discardAll, pending, schedule };
}
