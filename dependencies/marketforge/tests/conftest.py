"""
Pytest configuration for MarketForge tests.

Makes scripts/ importable as a package.
"""
import sys
from pathlib import Path

# Add scripts/ to sys.path so we can import as modules
ROOT = Path(__file__).parent.parent
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))


import pytest


@pytest.fixture
def tmp_marketing_plan(tmp_path):
    """Create a temporary marketing-plan directory structure for tests."""
    plan = tmp_path / "marketing-plan"
    plan.mkdir()
    (plan / "01-foundations").mkdir()
    (plan / "02-strategy").mkdir()
    (plan / "auditability").mkdir()
    return plan


@pytest.fixture
def good_decision_card():
    """A canonical good decision card per opinionated-marketing-decision-template.md."""
    return """### [DEC-052] Paid acquisition channel mix for Q3 — Apple Search Ads dominant

**Decision:** Allocate 65% of paid mobile budget ($6,500/mo of $10K) to Apple Search Ads.

**Why this:**
1. This is an iOS-heavy subscription consumer product with mature acquisition.
2. iOS 17/18 Custom Product Pages produce 156% conversion lift.

**Why not the alternatives:**
- 50/50 ASA/UAC: Underweights ASA's intent quality.
- 80/20 ASA/UAC: Sacrifices Android scale.

**Confidence:** High
**Evidence grade:** B
**Source basis:** Research-backed

**Commercial-bias flag:** Low

**Evidence:**
- SplitMetrics Apple Ads 2026 benchmarks (evidence B).

**Asset / channel / metric bindings:**
- Channel: paid-mobile
- Owner: Paid-media lead

**Kill criterion:** D30 ROAS < 0.6 sustained.
**Reversal trigger:** Android revenue share >45%.
**Test window:** 90 days.

**Anti-pattern to avoid:** Splitting $10K across 5 channels.

**Cross-cites consumed:** DEC-012, DEC-046, DEC-048.
"""


@pytest.fixture
def slop_decision_card():
    """A canonical slop card that the validator must catch."""
    return """### Paid mobile strategy

We recommend running Apple Search Ads and Google UAC to drive installs. Consider starting with a 50/50 split.

Leverage our world-class platform to unlock your potential.
"""
