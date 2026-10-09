---
name: api-client-react subpath exports
description: Package.json exports configuration required for @workspace/api-client-react
---

## Rule
The `./custom-fetch` subpath must be explicitly declared in `lib/api-client-react/package.json` exports or Vite will throw "Missing specifier" at build time.

**Why:** Vite resolves subpath imports from package.json `exports` map. Without it, `import { setAuthTokenGetter } from '@workspace/api-client-react/custom-fetch'` fails.

**Current exports map:**
```json
{
  ".": "./src/index.ts",
  "./custom-fetch": "./src/custom-fetch.ts"
}
```

Also: do not duplicate `export *` lines in `src/index.ts` — it causes silent module resolution ambiguity.
