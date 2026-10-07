import sys
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.calculator import safe_eval_expr, extract_and_verify_calculations
from app.models.schemas import DocumentChunk
from app.reasoning import reasoning_engine
from app.gap_analyzer import analyze_document_gaps
from app.consistency_checker import check_document_consistency

class TestProofAndMath(unittest.TestCase):
    def test_ast_safe_eval_basic_arithmetic(self):
        self.assertAlmostEqual(safe_eval_expr("70.8 - 82.5"), -11.7, places=2)
        self.assertAlmostEqual(safe_eval_expr("((70.8 - 82.5) / 82.5) * 100"), -14.18, places=1)
        self.assertEqual(safe_eval_expr("18 - 5"), 13.0)
        self.assertAlmostEqual(safe_eval_expr("13 * 0.65"), 8.45, places=2)
        self.assertAlmostEqual(safe_eval_expr("70.8 + 8.45"), 79.25, places=2)

    def test_ast_safe_eval_division_by_zero(self):
        self.assertIsNone(safe_eval_expr("100 / 0"))

    def test_extract_and_verify_calculations(self):
        text = """
        Operational Analysis:
        - Baseline Efficiency dropped from 82.5% to 70.8%.
        - Absolute Variance: 70.8 - 82.5 = -11.7%
        - Percentage Decline: ((70.8 - 82.5) / 82.5) * 100 = -14.18%
        """
        chunks = [
            DocumentChunk(id="c1", document_id="doc1", content="Efficiency was 82.5% in Q2 and 70.8% in Q4")
        ]
        calcs = extract_and_verify_calculations(text, chunks)
        self.assertGreaterEqual(len(calcs), 2)
        self.assertTrue(all(c.status == "VERIFIED" for c in calcs))

    def test_proof_level_determination(self):
        chunks = [DocumentChunk(id="c1", document_id="doc1", content="82.5% in Q2, 70.8% in Q4")]
        calcs = extract_and_verify_calculations("70.8 - 82.5 = -11.7%", chunks)
        level, _ = reasoning_engine._determine_proof_level("Compare Q2 and Q4 variance", "Variance is -11.7%", calcs, chunks)
        self.assertEqual(level, "Calculated")

    def test_gap_analyzer(self):
        res = analyze_document_gaps("sample_doc", BACKEND_DIR / "data" / "processed")
        self.assertTrue(res["success"])
        self.assertIn("completeness_score", res)
        self.assertGreater(len(res["gaps"]), 0)

    def test_consistency_checker(self):
        conflicts = check_document_consistency(BACKEND_DIR / "data" / "processed")
        self.assertIsInstance(conflicts, list)
        self.assertGreater(len(conflicts), 0)
        self.assertTrue(hasattr(conflicts[0], "discrepancy"))

if __name__ == "__main__":
    unittest.main()
