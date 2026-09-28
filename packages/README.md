# Trexio Shared Packages

Target shared package boundary.

- `types/` — shared domain/API types
- `validation/` — shared request/domain validation
- `api-client/` — frontend API client contracts
- `ui/` — genuinely reusable UI primitives
- `config/` — shared non-secret configuration

No package may contain database credentials or direct application persistence.