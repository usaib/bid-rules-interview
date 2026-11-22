/**
 * The only place the server reads the current time.
 * Always call `now()` instead of `new Date()` / `Date.now()` so tests can freeze time.
 */
let frozen: Date | null = null;

export function now(): Date {
  return frozen ? new Date(frozen.getTime()) : new Date();
}

/** Test helper. Pass `null` to unfreeze. */
export function setNowForTests(instant: Date | string | null): void {
  frozen = instant === null ? null : new Date(instant);
}
