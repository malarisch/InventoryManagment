// Lightweight logging for Vitest runs.
// Emits one line per test on start and on finish with status and duration.

import { beforeEach, afterEach } from 'vitest';
import type { TaskContext } from 'vitest';

// Minimal structural type to avoid tight coupling to Vitest internal types
interface LiteTask {
  id?: string;
  name?: string;
  suite?: LiteTask | null;
  parent?: LiteTask | null;
  result?: { state?: string; errors?: unknown[] } | null;
}

// Track start times by test id or full name as fallback.
const startTimes = new Map<string, number>();

function taskKey(task: LiteTask | undefined | null): string {
  // Prefer internal id when available (stable and unique)
  return (task?.id as string) || fullName(task);
}

function fullName(task: LiteTask | undefined | null): string {
  const names: string[] = [];
  let cur: LiteTask | undefined | null = task;
  while (cur) {
    if (cur?.name) names.unshift(String(cur.name));
    cur = cur?.suite ?? cur?.parent;
  }
  return names.join(' > ');
}

beforeEach((ctx: TaskContext) => {
  const task = ctx?.task as unknown as LiteTask | undefined;
  const key = taskKey(task);
  startTimes.set(key, Date.now());
  // Example: [TEST START] tests/vitest/foo.test.ts > suite > case
  // Keep logs compact to avoid noisy output in CI.
  console.log(`[TEST START] ${fullName(task)}`);
});

afterEach((ctx: TaskContext) => {
  const task = ctx?.task as unknown as LiteTask | undefined;
  const key = taskKey(task);
  const started = startTimes.get(key) ?? Date.now();
  const durationMs = Date.now() - started;
  const state = task?.result?.state ?? 'unknown';
  const name = fullName(task);

  if (state === 'failed') {
    const errors = (task?.result?.errors ?? []).map((e) => (e as { message?: string } | undefined)?.message || String(e));
    console.log(`[TEST END]   ${name} — FAILED in ${durationMs}ms`);
    for (const err of errors) console.log(`  • ${err}`);
  } else if (state === 'skipped' || state === 'todo') {
    console.log(`[TEST END]   ${name} — ${state.toUpperCase()}`);
  } else {
    console.log(`[TEST END]   ${name} — ${String(state).toUpperCase()} in ${durationMs}ms`);
  }
});
