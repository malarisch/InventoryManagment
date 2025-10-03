// Ensure Vitest loads environment variables similar to Next.js
// Priority order: .env.local > .env.test.local > .env.test > .env
// This covers local dev keys like SUPABASE_SERVICE_ROLE_KEY used by integration tests

import { config as loadEnv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let candidates = []
if ( process.env.NODE_ENV == "production") {
    candidates = [
        ".env.production"
    ]
} else {
candidates = [
  '.env.local',
  '.env.test.local',
  '.env.test',
  '.env',
];
}

for (const file of candidates) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) {
    loadEnv({ path: p, override: false });
  }
}

// Minimal sanity log for debugging (disabled by default)
// console.log('Loaded env for Vitest:', candidates.filter(f => fs.existsSync(path.join(root, f))));
