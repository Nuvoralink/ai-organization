# Secure workflow steps

This is the executable companion to [the secure workflow guide](../references/secure-workflow-guide.md).

1. Inventory contracts, compiler version, deployment mode, privileged roles, external calls, and
   upgrade/proxy/token features. Record exact paths and exclusions.
2. Run the repository's configured analyzers first. For Solidity, run Slither only when installed and
   applicable; capture the command's own exit and retain raw output. Never claim coverage from a tool
   that did not parse/build the target.
3. Generate inheritance, function, and state-variable authorization views when the code model supports
   them. Inspect the artifacts and map privileged writers to intended roles.
4. Write invariants before adding fuzz/formal checks: allowed transitions, conservation/precision,
   authorization, external-call ordering, and upgrade/storage constraints. Name a mutation for each.
5. Manually review privacy, ordering/MEV, cryptography, oracle/external assumptions, denial of service,
   key custody, and off-chain dependencies. Search for variants repo-wide.

Finish with findings ordered by exploitability/impact, tool coverage and gaps, raw artifact paths,
commands/exits, recommended fixes, and a clear approve/request-changes verdict.
