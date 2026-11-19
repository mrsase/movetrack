# The finish cycle

Every project in this portfolio gets finished the same way: seven phases, each with an
artifact and a gate. A phase is not "done" because time was spent on it — it is done when
its gate command or evidence exists.

```
design ──▶ code ──▶ test ──▶ verify ──▶ validate ──▶ evaluate ──▶ ship
  ▲           │        │         │           │            │          │
  └───────────┴────────┴─────────┴───────────┴────────────┴──────────┘
                 a failing gate sends you back, never forward
```

| Phase | Question it answers | Artifact | Gate |
| --- | --- | --- | --- |
| **Design** | What exactly is "finished", and what is explicitly not? | `docs/design.md` | Every acceptance criterion is observable and has an owner command |
| **Code** | Does the smallest coherent slice exist? | source + `docs/design.md` deltas | Code compiles and the feature is reachable from the UI or API |
| **Test** | Do we have fast, deterministic proof? | `server/test/*`, `client/src/**/*.test.tsx` | `npm test` — no flakes, no `.only` |
| **Verify** | Does the whole repo hold together? | `docs/verification.md` | `npm run verify` (typecheck + lint + test + build) |
| **Validate** | Does it work as a user would use it? | `docs/validation.md` + screenshots | `npm run smoke` on a clean DB **and** a driven browser session |
| **Evaluate** | Is this worth shipping as-is? | `docs/evaluation.md` | Measured numbers, known gaps, explicit go/no-go |
| **Ship** | Can a stranger run it in five minutes? | README, LICENSE, CI, tag, release notes | Public repo + green CI + `v1.0.0` tag |

## Non-negotiables

1. **A gate is a command, not an opinion.** If a phase has no command, it has no gate.
2. **Validation uses a clean database.** Demo data hides first-run bugs.
3. **Claims are measured.** "Fast", "small" and "tested" get numbers in `evaluation.md`.
4. **Ship is reversible, data is not.** Nothing destructive ships without a backup path and a test.
5. **The cycle is reused, not reinvented.** Next project copies this file and renames the gates.

## Commands

```bash
npm run setup      # install root + server + client
npm run dev        # api :4000 + web :5173 (proxy wired)
npm run verify     # typecheck + lint + test + build   ← the one gate that must stay green
npm run smoke      # end-to-end HTTP lifecycle on a throwaway database
npm run demo       # build once, seed a demo move, serve the production app
npm test           # unit + route + component tests
```

`verify` is what CI runs. `smoke` is what a human runs before tagging a release.
