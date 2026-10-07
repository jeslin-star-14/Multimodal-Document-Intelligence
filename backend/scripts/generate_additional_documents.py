import os
import sys
from pathlib import Path
import fitz  # PyMuPDF

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

UPLOADS_DIR = BACKEND_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def draw_header_bar(page, title, subtitle, date_str, doc_id_str, bg_rgb=(0.08, 0.22, 0.38)):
    # Top header bar
    page.draw_rect(fitz.Rect(0, 0, 595, 65), fill=bg_rgb, color=None)
    page.insert_text(fitz.Point(36, 32), title, fontsize=15, fontname="helv", color=(1, 1, 1))
    page.insert_text(fitz.Point(36, 48), subtitle, fontsize=9, fontname="helv", color=(0.85, 0.92, 0.98))
    page.insert_text(fitz.Point(440, 32), f"Date: {date_str}", fontsize=8.5, fontname="helv", color=(0.9, 0.95, 1))
    page.insert_text(fitz.Point(440, 46), f"Doc ID: {doc_id_str}", fontsize=8.5, fontname="helv", color=(0.9, 0.95, 1))

    # Bottom footer line
    page.draw_line(fitz.Point(36, 805), fitz.Point(559, 805), color=(0.8, 0.8, 0.8), width=0.8)
    page.insert_text(fitz.Point(36, 820), "Multimodal Document Intelligence | Verified Formal Report", fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))


def draw_table(page, top_y, headers, rows, col_widths, title="", header_bg=(0.90, 0.94, 0.98), header_fg=(0.05, 0.20, 0.35)):
    start_x = 36
    curr_y = top_y

    if title:
        page.insert_text(fitz.Point(start_x, curr_y - 8), title, fontsize=10.5, fontname="helv", color=header_fg)
        curr_y += 4

    total_w = sum(col_widths)
    header_h = 24
    page.draw_rect(fitz.Rect(start_x, curr_y, start_x + total_w, curr_y + header_h), fill=header_bg, color=(0.7, 0.8, 0.88), width=0.8)

    curr_x = start_x
    for i, h in enumerate(headers):
        page.insert_text(fitz.Point(curr_x + 8, curr_y + 16), h, fontsize=8.5, fontname="helv", color=header_fg)
        curr_x += col_widths[i]

    curr_y += header_h
    row_h = 20
    for r_idx, row in enumerate(rows):
        is_total = "Total" in str(row[0]) or "Consolidated" in str(row[0]) or "Overall" in str(row[0])
        bg_col = (0.94, 0.97, 1.0) if is_total else ((1, 1, 1) if r_idx % 2 == 0 else (0.98, 0.98, 0.99))
        text_col = header_fg if is_total else (0.15, 0.15, 0.15)
        
        page.draw_rect(fitz.Rect(start_x, curr_y, start_x + total_w, curr_y + row_h), fill=bg_col, color=(0.85, 0.88, 0.92), width=0.6)

        curr_x = start_x
        for i, val in enumerate(row):
            page.insert_text(fitz.Point(curr_x + 8, curr_y + 14), str(val), fontsize=8.5, fontname="helv", color=text_col)
            curr_x += col_widths[i]

        curr_y += row_h

    return curr_y + 16


def draw_bar_chart(page, top_y, title, categories, values, max_val, unit="$M", bar_color=(0.15, 0.45, 0.75)):
    start_x = 36
    chart_w = 460
    chart_h = 100
    curr_y = top_y

    page.insert_text(fitz.Point(start_x, curr_y), title, fontsize=10.5, fontname="helv", color=(0.1, 0.2, 0.3))
    curr_y += 15

    # Axis box
    page.draw_rect(fitz.Rect(start_x, curr_y, start_x + chart_w, curr_y + chart_h), fill=(0.98, 0.99, 1.0), color=(0.8, 0.85, 0.9), width=0.8)

    # Grid lines
    for i in range(1, 4):
        gy = curr_y + (chart_h / 4) * i
        page.draw_line(fitz.Point(start_x, gy), fitz.Point(start_x + chart_w, gy), color=(0.9, 0.92, 0.95), width=0.5)

    n = len(categories)
    slot_w = chart_w / n
    bar_w = slot_w * 0.45

    for i, (cat, val) in enumerate(zip(categories, values)):
        bx = start_x + slot_w * i + (slot_w - bar_w) / 2
        bh = (val / max_val) * (chart_h - 25)
        by = curr_y + chart_h - bh - 15

        page.draw_rect(fitz.Rect(bx, by, bx + bar_w, curr_y + chart_h - 15), fill=bar_color, color=None)

        # Label above bar
        val_str = f"{val}{unit}" if unit else f"{val}%"
        page.insert_text(fitz.Point(bx - 2, by - 4), val_str, fontsize=8, fontname="helv", color=(0.1, 0.2, 0.35))
        # Category label under axis
        page.insert_text(fitz.Point(bx - 4, curr_y + chart_h - 2), str(cat), fontsize=8, fontname="helv", color=(0.3, 0.35, 0.4))

    return curr_y + chart_h + 20


# ---------------------------------------------------------------------------
# Document 1: Financial Q3 Earnings Report (Corporate & Financial Domain)
# ---------------------------------------------------------------------------
def create_financial_q3_pdf() -> str:
    pdf_path = UPLOADS_DIR / "Financial_Q3_Earnings_Report.pdf"
    doc = fitz.open()

    # --- PAGE 1 ---
    page1 = doc.new_page(width=595, height=842)
    draw_header_bar(
        page1,
        title="Q3 Global Financial Earnings & Audit",
        subtitle="Consolidated P&L, Segment Margins & Capital Allocations",
        date_str="September 30, 2026",
        doc_id_str="FIN-2026-Q3",
        bg_rgb=(0.06, 0.22, 0.38)
    )

    y = 85
    page1.insert_text(fitz.Point(36, y), "1. Executive Financial Summary & Quarterly Highlights", fontsize=12, fontname="helv", color=(0.06, 0.22, 0.38))
    y += 18

    exec_text = (
        "During the third quarter (Q3 2026), consolidated corporate revenue reached $18.45M (+12.5% YoY),\n"
        "outperforming guidance by $650,000. Gross profit totaled $8.12M with a stable gross margin of 44.0%.\n"
        "Operating income stood at $3.62M (19.6% margin), while Net Profit expanded to $2.78M. Revenue growth\n"
        "was primarily driven by cloud software expansion in North America and robust enterprise demand in APAC."
    )
    for line in exec_text.split("\n"):
        page1.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.2, 0.25, 0.3))
        y += 14

    y += 15
    # Table 1: Regional Revenue Breakdown
    headers1 = ["Operating Segment", "Revenue ($M)", "YoY Growth", "Gross Margin", "Operating Profit"]
    rows1 = [
        ["North America (AMER)", "$9.25M", "+14.2%", "46.2%", "$2.10M"],
        ["Europe & Mid-East (EMEA)", "$5.40M", "+8.5%", "42.1%", "$0.95M"],
        ["Asia-Pacific (APAC)", "$3.80M", "+15.8%", "41.5%", "$0.57M"],
        ["Consolidated Total", "$18.45M", "+12.5%", "44.0%", "$3.62M"]
    ]
    col_w1 = [150, 95, 85, 95, 95]
    y = draw_table(page1, y, headers1, rows1, col_w1, title="Table 1: Q3 Revenue & Segment Operating Performance", header_bg=(0.90, 0.94, 0.98), header_fg=(0.06, 0.22, 0.38))

    y += 5
    # Figure 1: Bar chart of segment revenues
    y = draw_bar_chart(
        page1,
        y,
        title="Figure 1: Segment Revenue Distribution ($M)",
        categories=["AMER", "EMEA", "APAC", "Total"],
        values=[9.25, 5.40, 3.80, 18.45],
        max_val=20.0,
        unit="$M",
        bar_color=(0.12, 0.40, 0.68)
    )

    # --- PAGE 2 ---
    page2 = doc.new_page(width=595, height=842)
    draw_header_bar(
        page2,
        title="Q3 Operating Expense Breakdown & Cash Flow",
        subtitle="R&D Expenditure, Capital Allocation & Free Cash Flow Verification",
        date_str="September 30, 2026",
        doc_id_str="FIN-2026-Q3",
        bg_rgb=(0.06, 0.22, 0.38)
    )

    y = 85
    page2.insert_text(fitz.Point(36, y), "2. Operating Expenses & Strategic R&D Allocation", fontsize=12, fontname="helv", color=(0.06, 0.22, 0.38))
    y += 18
    sec2_text = (
        "Operating expenses (OpEx) for Q3 totaled $4.50M, representing 24.4% of total revenue.\n"
        "Strategic research and development (R&D) investments increased by 18.2% YoY to accelerate AI compute\n"
        "infrastructure, while sales efficiency improvements decreased administrative overhead by 2.1%."
    )
    for line in sec2_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.2, 0.25, 0.3))
        y += 14

    y += 15
    # Table 2: OpEx Breakdown
    headers2 = ["Expense Category", "Q3 Amount", "Share of OpEx", "YoY Change", "Budget Variance"]
    rows2 = [
        ["Research & Development (R&D)", "$2,100,000", "46.7%", "+18.2%", "+$50,000 (Within Plan)"],
        ["Sales & Marketing (S&M)", "$1,420,000", "31.6%", "+5.4%", "-$80,000 (Favorable)"],
        ["General & Administrative (G&A)", "$980,000", "21.7%", "-2.1%", "-$40,000 (Favorable)"],
        ["Total Operating Expenses", "$4,500,000", "100.0%", "+9.8%", "-$70,000 (Net Favorable)"]
    ]
    col_w2 = [155, 95, 85, 85, 100]
    y = draw_table(page2, y, headers2, rows2, col_w2, title="Table 2: Operating Expense Breakdown by Function (Q3 2026)", header_bg=(0.90, 0.94, 0.98), header_fg=(0.06, 0.22, 0.38))

    y += 10
    page2.insert_text(fitz.Point(36, y), "3. Cash Flow Metrics & Mathematical Verification", fontsize=11, fontname="helv", color=(0.06, 0.22, 0.38))
    y += 16
    math_text = (
        "Mathematical Financial Formulations:\n"
        "  - Operating Cash Flow = $4,250,000 (23.0% of revenue)\n"
        "  - Capital Expenditures (CapEx) = $1,150,000 (cloud infrastructure & compute servers)\n"
        "  - Free Cash Flow (FCF) = Operating Cash Flow - CapEx\n"
        "      FCF = $4,250,000 - $1,150,000 = $3,100,000 ($3.10M)\n"
        "  - FCF Conversion Rate = (FCF / EBITDA) * 100% = ($3,100,000 / $4,120,000) * 100% = 75.24%\n"
        "  - Operating Margin = (Operating Income / Revenue) * 100% = ($3.62M / $18.45M) * 100% = 19.62%."
    )
    for line in math_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9, fontname="helv", color=(0.25, 0.25, 0.3))
        y += 14

    doc.save(str(pdf_path))
    doc.close()
    print("Generated:", pdf_path)
    return str(pdf_path)


# ---------------------------------------------------------------------------
# Document 2: Clinical Trial Phase III Results (Healthcare & Biotech Domain)
# ---------------------------------------------------------------------------
def create_clinical_trial_pdf() -> str:
    pdf_path = UPLOADS_DIR / "Clinical_Trial_Phase3_Results.pdf"
    doc = fitz.open()

    # --- PAGE 1 ---
    page1 = doc.new_page(width=595, height=842)
    draw_header_bar(
        page1,
        title="Phase III Clinical Investigation: NeuroShield (VX-409)",
        subtitle="Efficacy, Patient Stratification & Primary Endpoint Audit",
        date_str="August 15, 2026",
        doc_id_str="MED-2026-CT3",
        bg_rgb=(0.28, 0.08, 0.22)
    )

    y = 85
    page1.insert_text(fitz.Point(36, y), "1. Executive Summary & Study Design Overview", fontsize=12, fontname="helv", color=(0.28, 0.08, 0.22))
    y += 18

    exec_text = (
        "A multicenter, double-blind, randomized, placebo-controlled Phase III study evaluated the therapeutic\n"
        "efficacy and safety profile of NeuroShield (VX-409) across 1,200 participants across 18 medical centers.\n"
        "The primary cognitive retention endpoint was met with high statistical significance (p < 0.001).\n"
        "At Week 48, 88.4% of subjects in the High-Dose (100mg) cohort demonstrated cognitive stability versus\n"
        "51.2% in the placebo cohort, demonstrating substantial clinical neuroprotection."
    )
    for line in exec_text.split("\n"):
        page1.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.25, 0.2, 0.25))
        y += 14

    y += 15
    # Table 1: Patient Cohort Demographics
    headers1 = ["Cohort Group", "Sample (n)", "Mean Age", "Female %", "Retention Rate (W48)"]
    rows1 = [
        ["High-Dose (100mg)", "400", "64.5 yrs", "54.2%", "95.5% (382 pts)"],
        ["Low-Dose (50mg)", "400", "63.8 yrs", "52.8%", "94.0% (376 pts)"],
        ["Placebo Control", "400", "64.1 yrs", "53.5%", "91.2% (365 pts)"],
        ["Total Study Population", "1,200", "64.1 yrs", "53.5%", "93.6% (1,123 pts)"]
    ]
    col_w1 = [140, 85, 85, 80, 130]
    y = draw_table(page1, y, headers1, rows1, col_w1, title="Table 1: Participant Cohort Stratification & Demographic Baseline", header_bg=(0.98, 0.92, 0.96), header_fg=(0.28, 0.08, 0.22))

    y += 5
    # Figure 1: Bar chart of Cognitive Stability Rate
    y = draw_bar_chart(
        page1,
        y,
        title="Figure 1: Cognitive Preservation Rate at Week 48 (%)",
        categories=["High-Dose", "Low-Dose", "Placebo", "Target Benchmark"],
        values=[88.4, 76.5, 51.2, 70.0],
        max_val=100.0,
        unit="%",
        bar_color=(0.58, 0.18, 0.45)
    )

    # --- PAGE 2 ---
    page2 = doc.new_page(width=595, height=842)
    draw_header_bar(
        page2,
        title="Biomarker Modulation & Pharmacovigilance Safety",
        subtitle="Secondary Endpoints, Plaque Clearance & Biostatistical Proof",
        date_str="August 15, 2026",
        doc_id_str="MED-2026-CT3",
        bg_rgb=(0.28, 0.08, 0.22)
    )

    y = 85
    page2.insert_text(fitz.Point(36, y), "2. Biomarker Efficacy & Adverse Event Profile", fontsize=12, fontname="helv", color=(0.28, 0.08, 0.22))
    y += 18
    sec2_text = (
        "Positron emission tomography (PET) imaging demonstrated a mean 42.8% reduction in cortical amyloid\n"
        "plaque burden in the 100mg cohort compared to a 4.2% increase in the placebo group. Serious Adverse Events\n"
        "(SAEs) occurred in 4.2% of active drug subjects versus 3.8% of placebo subjects (p = 0.72, non-significant),\n"
        "confirming that VX-409 exhibits an excellent clinical safety and tolerability window."
    )
    for line in sec2_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.25, 0.2, 0.25))
        y += 14

    y += 15
    # Table 2: Biomarkers & Safety
    headers2 = ["Biomarker / Safety Endpoint", "High-Dose 100mg", "Low-Dose 50mg", "Placebo Control", "p-value"]
    rows2 = [
        ["Amyloid Plaque Reduction", "-42.8%", "-28.4%", "+4.2%", "p < 0.001"],
        ["CSF Phospho-Tau Reduction", "-36.5%", "-21.0%", "+2.8%", "p < 0.001"],
        ["Mild Headache (Transient)", "8.5%", "6.2%", "5.0%", "p = 0.12"],
        ["Discontinuation Due to AEs", "4.5%", "4.0%", "6.8%", "p = 0.24"]
    ]
    col_w2 = [170, 95, 85, 90, 80]
    y = draw_table(page2, y, headers2, rows2, col_w2, title="Table 2: Secondary Biomarker Efficacy & Safety Events", header_bg=(0.98, 0.92, 0.96), header_fg=(0.28, 0.08, 0.22))

    y += 10
    page2.insert_text(fitz.Point(36, y), "3. Biostatistical Formulation & Hazard Ratio Verification", fontsize=11, fontname="helv", color=(0.28, 0.08, 0.22))
    y += 16
    math_text = (
        "Biostatistical Formulations:\n"
        "  - Hazard Ratio (HR) = 0.58 (95% CI: [0.47, 0.71], p < 0.0001 via Cox Proportional Hazards Model)\n"
        "  - Cognitive Decline Event Rates: Placebo = 48.8%, High-Dose VX-409 = 11.6%\n"
        "  - Absolute Risk Reduction (ARR) = EventRate_Placebo - EventRate_Active\n"
        "      ARR = 48.8% - 11.6% = 37.2% (0.372)\n"
        "  - Number Needed to Treat (NNT) = 1 / ARR\n"
        "      NNT = 1 / 0.372 = 2.69 patients (Treating ~3 patients prevents 1 cognitive decline event)\n"
        "  - Relative Risk Reduction (RRR) = (ARR / EventRate_Placebo) * 100% = (37.2% / 48.8%) * 100% = 76.23%."
    )
    for line in math_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9, fontname="helv", color=(0.25, 0.25, 0.3))
        y += 14

    doc.save(str(pdf_path))
    doc.close()
    print("Generated:", pdf_path)
    return str(pdf_path)


if __name__ == "__main__":
    print("=== Generating Additional Diverse Documents ===")
    p1 = create_financial_q3_pdf()
    p2 = create_clinical_trial_pdf()

    from ingestion.universal_parser import ingest_any_file
    from retrieval.indexer import index_document

    print("\n=== Ingesting & Indexing Documents ===")
    res1 = ingest_any_file(p1, output_base_dir=str(BACKEND_DIR / "data"))
    cnt1 = index_document(res1, index_dir=str(BACKEND_DIR / "data" / "index"))
    print(f"Ingested and indexed {os.path.basename(p1)}: {cnt1} evidence items (ID: {res1['document_id']}).")

    res2 = ingest_any_file(p2, output_base_dir=str(BACKEND_DIR / "data"))
    cnt2 = index_document(res2, index_dir=str(BACKEND_DIR / "data" / "index"))
    print(f"Ingested and indexed {os.path.basename(p2)}: {cnt2} evidence items (ID: {res2['document_id']}).")

    print("\nAll additional documents successfully created, ingested, and indexed!")
