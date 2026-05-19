import { useRef, useCallback } from 'react';

export function useUndoableAction<T>(
  execute: (args: T) => Promise<void>,
  undo: (args: T) => Promise<void>,
  timeoutMs = 5000,
) {
  const pending = useRef<{ args: T; timer: ReturnType<typeof setTimeout> } | null>(null);
  const onUndoRef = useRef<((args: T) => void) | null>(null);

  const run = useCallback(
    async (args: T, onUndo?: (args: T) => void) => {
      onUndoRef.current = onUndo ?? null;
      await execute(args);
      const timer = setTimeout(() => {
        pending.current = null;
      }, timeoutMs);
      pending.current = { args, timer };
    },
    [execute, timeoutMs],
  );

  const handleUndo = useCallback(async () => {
    if (!pending.current) return;
    const { args, timer } = pending.current;
    clearTimeout(timer);
    pending.current = null;
    await undo(args);
    onUndoRef.current?.(args);
    onUndoRef.current = null;
  }, [undo]);

  const hasPending = useCallback(() => pending.current !== null, []);

  return { run, handleUndo, hasPending };
}
