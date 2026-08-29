# TREXIO ARCHITECTURE TECHNICAL DEBT REGISTER

| Debt ID | System Area | Problem Description | Impact & Risk Level | Priority | Recommended Remediation | Target Completion | Status |
|---|---|---|---|---|---|---|---|
| `ATD-001` | Cloud SQL Schema | Legacy seed files in `/src/db/seeds` retain unindexed test data | Low (Does not impact production SQL execution) | P3 | Archive legacy seed files and rely solely on versioned migrations | Phase DB-CQ | Open |
| `ATD-002` | API Response Layer | Some list endpoints lack explicit response field selection (`SELECT *` instead of projected columns) | Medium (Slightly larger JSON payload sizes) | P2 | Refactor query repositories to project required column names explicitly | Phase DB-CQ | Open |
| `ATD-003` | Background Jobs | Notification dispatch operates synchronously on certain event hooks | Medium (Minor latency overhead on notification triggers) | P2 | Move all notification dispatches to background async queue workers | Phase DB-CQ | Open |
