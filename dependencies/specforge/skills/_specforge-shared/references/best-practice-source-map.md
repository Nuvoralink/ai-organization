# Best Practice Source Map

Use this map when producing app documentation. If current internet research is available, verify these sources and prefer the newest official stable version. If internet access is not available, use this as the baked-in baseline and state that online research was not available.

Do not treat this map as a legal checklist. Use it to identify software, security, accessibility, architecture, API, supply-chain, and AI-risk requirements that belong in the documentation.

## Codex and agent workflow sources

- OpenAI Codex Agent Skills documentation. Use for skill structure, trigger descriptions, progressive disclosure, skill locations, optional scripts, references, assets, and `agents/openai.yaml` metadata.
  URL: https://developers.openai.com/codex/skills
- OpenAI Codex AGENTS.md documentation. Use for project-specific repo guidance, precedence, overrides, fallback names, instruction layering, and durable repo rules.
  URL: https://developers.openai.com/codex/guides/agents-md
- OpenAI Codex Best Practices. Use for prompt structure, plan-first work, reusable guidance, AGENTS.md, testing, review, sandboxing, MCP, and stable workflows.
  URL: https://developers.openai.com/codex/learn/best-practices
- OpenAI Codex Customization documentation. Use for the difference between AGENTS.md, skills, MCP, plugins, memories, and subagents.
  URL: https://developers.openai.com/codex/concepts/customization
- OpenAI Codex Subagents documentation. Use only when the user explicitly wants parallel specialist agents or when repo analysis is highly parallel.
  URL: https://developers.openai.com/codex/subagents

## Secure software and application security sources

- NIST SP 800-218, Secure Software Development Framework, SSDF 1.1, final, February 2022. Use as the stable baseline for secure software planning, software protection, secure production, and vulnerability response.
  URL: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST SP 800-218r1, SSDF 1.2, initial public draft, December 2025. Use only as non-final awareness unless the user explicitly accepts draft guidance.
  URL: https://csrc.nist.gov/pubs/sp/800/218/r1/ipd
- NIST SP 800-218A, Secure Software Development Practices for Generative AI and Dual-Use Foundation Models, July 2024. Use when the app includes AI model development or AI-system components.
  URL: https://www.nist.gov/publications/secure-software-development-practices-generative-ai-and-dual-use-foundation-models-ssdf
- CISA Secure by Design. Use for secure-by-default requirements, customer safety, transparency, eliminating classes of vulnerability, and reducing security burden on users.
  URL: https://www.cisa.gov/resources-tools/resources/secure-by-design
- OWASP Application Security Verification Standard, ASVS 5.0.0, released May 2025. Use as the baseline for web application and API security requirements.
  URL: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Mobile Application Security Verification Standard, MASVS. Use when the app includes mobile clients.
  URL: https://mas.owasp.org/MASVS/
- OWASP Software Assurance Maturity Model, SAMM. Use for security program coverage across governance, design, implementation, verification, and operations.
  URL: https://owasp.org/www-project-samm/
- OWASP Top 10 Web Application Security Risks, current released version 2025. Use for awareness and risk framing, not as the only security checklist.
  URL: https://owasp.org/www-project-top-ten/
- OWASP Threat Modeling Cheat Sheet. Use for asset, trust boundary, threat, mitigation, and validation structure.
  URL: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
- OWASP Threat Modeling. Use for threat model contents: modeled subject, assumptions, threats, mitigations, validation, verification of mitigations, and prioritized security improvements.
  URL: https://owasp.org/www-community/Threat_Modeling
- OWASP Secure Product Design Cheat Sheet. Use for explicit security decisions, risk-driven controls, and secure design documentation.
  URL: https://cheatsheetseries.owasp.org/cheatsheets/Secure_Product_Design_Cheat_Sheet.html
- OWASP Top 10 CI/CD Security Risks and OWASP CI/CD Security Cheat Sheet. Use for pipeline, secrets, artifact, and deployment risk.
  URL: https://owasp.org/www-project-top-10-ci-cd-security-risks/
  URL: https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html
- OWASP Top 10 for LLM Applications 2025. Use when the product includes LLMs, agents, RAG, tools, vector stores, generated content, or AI automation.
  URL: https://genai.owasp.org/llm-top-10/
- NIST AI 600-1, Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile, July 2024. Use for generative AI risk identification and risk-management actions.
  URL: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence

## Architecture, API, UX, accessibility, and supply chain sources

- C4 Model. Use for context, container, component, and code-level architecture maps. Use only the useful levels.
  URL: https://c4model.com/
- Architectural Decision Records. Use for decision records that capture architecturally significant choices, rationale, tradeoffs, consequences, and decision logs.
  URL: https://adr.github.io/
- Google Cloud Architecture Decision Records overview. Use for ADR reader, timestamp, and cross-team communication guidance when infrastructure or application teams need durable design rationale.
  URL: https://docs.cloud.google.com/architecture/architecture-decision-records
- arc42. Use for architecture documentation structure, context, constraints, solution strategy, building blocks, runtime view, deployment view, risks, and tradeoffs.
  URL: https://arc42.org/
- OpenAPI Specification, latest stable v3.2.0 as of September 2025. Use for HTTP API contracts, request and response schemas, error models, auth declarations, and examples unless the project clearly uses GraphQL, gRPC, AsyncAPI, or another formal contract standard.
  URL: https://spec.openapis.org/oas/v3.2.0.html
- Google Developer Documentation Style Guide. Use for clear, consistent developer-facing documentation after project-specific terminology and style rules.
  URL: https://developers.google.com/style/
- Atlassian Product Requirements Document guidance. Use as a product-documentation baseline for purpose, assumptions, user stories, options, success metrics, supporting context, open questions, and scope boundaries.
  URL: https://www.atlassian.com/software/confluence/templates/product-requirements
- W3C WCAG 2.2, W3C Recommendation. Use as the baseline for web accessibility requirements, success criteria, accessible states, forms, navigation, and UI acceptance criteria.
  URL: https://www.w3.org/TR/WCAG22/
- SLSA, Supply-chain Levels for Software Artifacts, current approved v1.2. Use for source integrity, build provenance, artifact integrity, and software supply-chain controls.
  URL: https://slsa.dev/spec/v1.2/

## Source preference rules

1. Prefer official standards, official framework docs, official vendor docs, and primary project docs.
2. Prefer the newest stable release over drafts unless the user explicitly wants draft guidance.
3. For stack-specific choices, research the official docs for the selected framework, runtime, package manager, database, cloud provider, CI provider, deployment platform, and auth provider.
4. Do not invent versions, laws, policy requirements, or compliance obligations.
5. For legal, health, finance, education, child data, biometrics, payments, or regulated domains, flag that qualified review is needed. Do not pretend the docs are legal advice.
6. For each source used, record: title, owner, version or publication date, URL, document sections affected, requirement IDs affected, and whether the source is stable or draft.
7. If a source conflicts with repo evidence, use repo evidence for current behavior and the source for recommended requirements. Record the gap.


## Platform policy, compliance, operations, analytics, and supply-chain sources

- Apple App Store Review Guidelines. Use when the app may ship on Apple platforms. Map requirements to Safety, Performance, Business, Design, and Legal sections. Verify current guideline date before using.
  URL: https://developer.apple.com/app-store/review/guidelines/
- Google Play Developer Program Policies. Use when the app may ship through Google Play. Verify current effective date and policy updates before using.
  URL: https://support.google.com/googleplay/android-developer/answer/16933379
- Google Play User Data policy and Data safety form guidance. Use for Android privacy disclosures, user data collection, sharing, security practices, and in-app disclosure requirements.
  URL: https://support.google.com/googleplay/android-developer/answer/10144311
  URL: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play Families policy. Use when the app targets or may attract children or families. Always flag qualified review for age and child-data obligations.
  URL: https://support.google.com/googleplay/android-developer/answer/9893335
- PCI DSS v4.0.1, PCI Security Standards Council. Use when cardholder data might be stored, processed, or transmitted. Prefer using payment providers to reduce PCI scope and record assumptions.
  URL: https://www.pcisecuritystandards.org/document_library/
- Stripe security and integration security docs. Use only when Stripe is selected or being evaluated. Map shared responsibility and PCI scope.
  URL: https://docs.stripe.com/security
  URL: https://docs.stripe.com/security/guide
- European Commission GDPR and data protection guidance. Use only when EU users, EU processing, or EU launch regions are in scope. Flag qualified review.
  URL: https://commission.europa.eu/law/law-topic/data-protection_en
- FTC privacy and security business guidance. Use when US consumer privacy, data security, children, financial, or health privacy may be in scope. Flag qualified review.
  URL: https://www.ftc.gov/business-guidance/privacy-security
- FTC COPPA Rule. Use when the app is directed to children under 13 or has actual knowledge of collecting data from children under 13. Flag qualified review.
  URL: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- EU AI Act official timeline and European Commission AI Act guidance. Use when the product includes AI features and EU users or EU market access may be in scope. Treat legal classification as review-needed.
  URL: https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act
  URL: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- OpenTelemetry official documentation. Use for logs, metrics, traces, instrumentation, and observability architecture.
  URL: https://opentelemetry.io/docs/
- OWASP CycloneDX. Use for SBOM, SaaSBOM, ML-BOM, VEX, dependency inventory, and supply-chain documentation.
  URL: https://cyclonedx.org/
- SPDX specification and SPDX License List. Use for SBOM format, license identification, license expressions, and license-review documentation.
  URL: https://spdx.dev/use/specifications/
  URL: https://spdx.org/licenses/
- OpenSSF Scorecard. Use for dependency and open-source project risk checks when dependencies are introduced or reviewed.
  URL: https://openssf.org/projects/scorecard/
