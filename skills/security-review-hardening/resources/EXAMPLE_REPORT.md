# Example secure-workflow report

## Verdict

REQUEST CHANGES — one high-impact authorization defect remains.

## Finding

- Severity: High
- Location: `contracts/Vault.sol:84`
- Impact: an untrusted caller can change the withdrawal recipient.
- Attack path: public entry point -> missing role check -> recipient state update -> authorized withdrawal
  sends assets to attacker-controlled address.
- Evidence: Slither access-control result plus manual caller trace and failing unauthorized-call test.
- Durable fix: enforce the canonical role at the command boundary and retain the storage invariant.
- Killer mutation: remove the role check; the unauthorized-call test must succeed red/fail the suite.

## Workflow evidence

- Known-issue scan: completed; raw report retained; exact exit recorded.
- Feature checks: upgradeable proxy present; storage-layout compatibility inspected.
- Diagrams: inheritance/function/authorization artifacts opened.
- Properties: authorization, asset conservation, and terminal-state immutability fuzzed.
- Manual review: privacy, ordering, cryptography, oracle, and off-chain key custody reached.

## Gaps

Name tools, environments, contracts, and runtime paths not reached. Never call unreviewed scope clean.
