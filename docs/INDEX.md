# StepNow — Documentation Index

This is the entry point for all StepNow project documentation. Every meaningful design decision, architectural convention, and content reference lives here. **When code and document disagree, the code wins and the document gets updated** — but if a PR ships code that contradicts a document without updating it, the PR is rejected.

---

## How to navigate

The documents below are listed in roughly the order you'd read them if you were new to the project. Skip ahead based on what you need.

### Start here

| Document | Purpose |
|---|---|
| **[../README.md](../README.md)** | Project overview, local setup, tech stack at a glance |
| **[website-outline.md](./website-outline.md)** | Every page on the site, section by section, with content sources and SEO meta |

### Architecture (the conventions code must follow)

| Document | Scope |
|---|---|
| **[architecture/backend.md](./architecture/backend.md)** | FastAPI backend — five-layer flow, repository layout, all-DB content model, operational safeguards, what is forbidden |
| **[architecture/frontend.md](./architecture/frontend.md)** | Next.js frontend — three-tier components, i18n, data fetching strategy, admin panel surfaces, what is forbidden |

These are the **most authoritative** documents. If you're writing code, read the relevant one before you start. Disagreement between code and these docs is resolved by updating one of them in the same PR.

### Design and content

| Document | Purpose |
|---|---|
| **[design-direction.md](./design-direction.md)** | Visual direction (premium chauffeur feel), type system, color palette, photography strategy on a zero-budget |
| **[triage-checklist.md](./triage-checklist.md)** | Prioritized fixes for the current live site at step-now.de — separate track from the rebuild |

### Legal drafts

The German versions are the legally binding ones. English versions are translations for reference and for the English-language version of the site (which displays a disclaimer about which version controls).

| Document | Language | Status |
|---|---|---|
| **[legal/impressum-de.md](./legal/impressum-de.md)** | German | Draft — needs concession number + tax ID from Naeem, lawyer review before publishing |
| **[legal/impressum-en.md](./legal/impressum-en.md)** | English | Draft — for review and English version of the site |
| **[legal/datenschutz-de.md](./legal/datenschutz-de.md)** | German | Draft — needs review when Google services / Plausible / etc. are actually added |

The full body of legal pages, once finalized, will be stored in the database (`legal_pages` and `legal_page_versions` tables) and edited via the admin panel. These markdown drafts are the **starting content** that gets seeded into the database, not the long-term source of truth.

### Runbooks

| Document | Purpose |
|---|---|
| `runbooks/` (folder) | Operational procedures — to be written as the deploy pipeline and backup/restore flows are built |

### Archive

| Document | Purpose |
|---|---|
| **[archive/rebuild-plan-v1.md](./archive/rebuild-plan-v1.md)** | Earlier high-level rebuild plan, superseded by `website-outline.md` and the two architecture documents. Kept for historical reference. |

---

## The decision trail (for the curious)

Major architectural decisions, with their reasoning, in roughly the order they were made:

1. **Monorepo over two repos.** Single solo developer, atomic changes across stacks, type-safety between backend and frontend, documentation co-located with code. Standard `apps/{backend,frontend}` + root `docs/`. See README §What's in this repo.

2. **All content in the database, including legal pages and UI strings.** Naeem is the business owner and has authority over every piece of text on the site. The operational safeguards (§15 of the backend architecture) mitigate the risks of mistakes without restricting his authority. See `architecture/backend.md` §1.2 (Risk Acknowledgement) for the explicit risk documentation.

3. **`_de` and `_en` columns per row, not a separate translations table.** Simpler queries, simpler admin UX (one form, both languages side-by-side), no joins required to render a page. See `architecture/backend.md` §8.

4. **German at root, English at `/en/`.** SEO favors having the primary German content at `step-now.de/` without a redirect. Cookie-based language persistence with `Accept-Language` detection on first visit. See `architecture/frontend.md` §9.

5. **No BFF (Backend-for-Frontend) layer in Next.js.** Same-origin nginx routing makes a BFF unnecessary. Public reads happen in React Server Components calling FastAPI directly via internal hostname. Browser POSTs go straight to FastAPI public endpoints. See `architecture/frontend.md` §8.

6. **Premium-chauffeur visual direction on a zero-photography budget.** Type-driven design (serif headlines, generous space, gold accent on black), with three carefully composed phone shots from Naeem to carry the entire visual story. See `design-direction.md`.

---

## How to update this index

Whenever a new document is added to `docs/`, add a row to the appropriate section above. If a document is archived or superseded, move it to the Archive section with a brief note about why. If the decision trail evolves (a major decision is reversed or refined), update the relevant numbered item.

This index is itself living documentation. It's the map for the maps.
