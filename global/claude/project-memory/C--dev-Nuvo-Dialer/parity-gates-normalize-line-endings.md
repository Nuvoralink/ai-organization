---
name: parity-gates-normalize-line-endings
description: "A parity/digest gate that hashes raw bytes reports \"modified\" on byte-identical-per-git files in a CRLF worktree — normalize text to LF before hashing."
metadata: 
  node_type: memory
  type: project
  originSessionId: 7a2c7c4e-76ad-45a7-bc78-d3e6920d076a
  modified: 2026-08-05T09:30:17.419Z
---

Git can materialize the same committed text as LF or CRLF depending on the checkout (`core.autocrlf`, or a worktree created under different settings). A parity gate that hashes **raw bytes** then fails in one checkout and passes in another, with `git status` clean in both — an unexplainable "managed file parity mismatch" that sends the reader hunting for a change nobody made.

Fixed 2026-08-05 in `scripts/check-organization-overlay.mjs` (dialer, delivered from the overlay source): it now normalizes text to LF before hashing and hashes binaries raw (NUL-byte detection), matching its sibling `check-overlay-parity.mjs` in CoachAI, which had always normalized. The stored digests are LF-based already, so no digest churn.

**Root cause, fixed 2026-08-05 in `scripts/lib/control-plane.mjs`:** its `normalizedBytes` normalized only extensions on a hardcoded `TEXT_EXTENSIONS` **allowlist** — a denylist-by-omission. `.mdc` was missing, which is the entire cause of CoachAI's "permanently drifting" `.cursor/rules`: those files are byte-identical after normalization, so there was never divergent content to reconcile. Detection is now content-based (NUL byte = binary). `.gitattributes` also gained `*.mdc text eol=lf`.

**Do NOT normalize the raw hashers.** `hashRawBytes`/`hashRawFile` (control-plane rollback + reviewed-target integrity) and the dialer's `mock-handoff-proof.mjs` `sha256File` (tamper/evidence bundles) are exact-bytes proofs where a CRLF rewrite IS a real change. Classify a hasher by PURPOSE — content identity vs exact-bytes integrity — before touching it.

**How to apply:** when shipping or reviewing any parity/digest gate, normalize line endings before hashing — and when a parity gate reports drift on a file `git status` says is clean, suspect the hasher before suspecting the file.

Related: [[managed-asset-fork-trap]].
