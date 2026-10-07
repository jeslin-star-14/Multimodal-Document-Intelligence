import os
import sys
from pathlib import Path
import fitz  # PyMuPDF

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

UPLOADS_DIR = BACKEND_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

def draw_header_bar(page, title, subtitle, date_str, doc_id_str):
    # Top header bar
    page.draw_rect(fitz.Rect(0, 0, 595, 65), fill=(0.05, 0.25, 0.22), color=None)
    page.insert_text(fitz.Point(36, 32), title, fontsize=16, fontname="helv", color=(1, 1, 1))
    page.insert_text(fitz.Point(36, 48), subtitle, fontsize=9, fontname="helv", color=(0.8, 0.9, 0.88))
    page.insert_text(fitz.Point(440, 32), f"Date: {date_str}", fontsize=8.5, fontname="helv", color=(0.9, 0.95, 0.9))
    page.insert_text(fitz.Point(440, 46), f"Doc ID: {doc_id_str}", fontsize=8.5, fontname="helv", color=(0.9, 0.95, 0.9))

    # Bottom footer line
    page.draw_line(fitz.Point(36, 805), fitz.Point(559, 805), color=(0.8, 0.8, 0.8), width=0.8)
    page.insert_text(fitz.Point(36, 820), "Multimodal Operations Benchmark | Confidential Internal Audit", fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))

def draw_table(page, top_y, headers, rows, col_widths, title=""):
    start_x = 36
    curr_y = top_y

    if title:
        page.insert_text(fitz.Point(start_x, curr_y - 8), title, fontsize=11, fontname="helv", color=(0.1, 0.2, 0.15))
        curr_y += 4

    total_w = sum(col_widths)
    # Header background
    header_h = 24
    page.draw_rect(fitz.Rect(start_x, curr_y, start_x + total_w, curr_y + header_h), fill=(0.92, 0.96, 0.94), color=(0.7, 0.8, 0.75), width=0.8)

    # Header text
    curr_x = start_x
    for i, h in enumerate(headers):
        page.insert_text(fitz.Point(curr_x + 8, curr_y + 16), h, fontsize=9, fontname="helv", color=(0.05, 0.25, 0.2))
        curr_x += col_widths[i]

    curr_y += header_h

    # Rows
    row_h = 20
    for r_idx, row in enumerate(rows):
        is_total = "Total" in str(row[0]) or "Avg" in str(row[0])
        bg_col = (0.95, 0.98, 0.96) if is_total else ((1, 1, 1) if r_idx % 2 == 0 else (0.98, 0.98, 0.98))
        text_col = (0.05, 0.25, 0.2) if is_total else (0.15, 0.15, 0.15)
        
        page.draw_rect(fitz.Rect(start_x, curr_y, start_x + total_w, curr_y + row_h), fill=bg_col, color=(0.85, 0.88, 0.85), width=0.6)

        curr_x = start_x
        for i, val in enumerate(row):
            page.insert_text(fitz.Point(curr_x + 8, curr_y + 14), str(val), fontsize=8.5, fontname="helv", color=text_col)
            curr_x += col_widths[i]

        curr_y += row_h

    return curr_y + 15

def draw_bar_chart(page, x, y, width, height, title, categories, values, max_val, unit="%"):
    # Chart container box
    page.draw_rect(fitz.Rect(x, y, x + width, y + height), fill=(0.98, 0.99, 0.98), color=(0.8, 0.85, 0.8), width=0.8)
    page.insert_text(fitz.Point(x + 12, y + 20), title, fontsize=10.5, fontname="helv", color=(0.1, 0.25, 0.2))

    chart_bottom = y + height - 35
    chart_top = y + 35
    chart_h = chart_bottom - chart_top
    chart_w = width - 70
    start_bar_x = x + 50

    # Draw Y axis grid lines
    for step in range(5):
        val = int(max_val * step / 4)
        gy = chart_bottom - (chart_h * step / 4)
        page.draw_line(fitz.Point(start_bar_x, gy), fitz.Point(start_bar_x + chart_w, gy), color=(0.88, 0.88, 0.88), width=0.5)
        page.insert_text(fitz.Point(start_bar_x - 30, gy + 3), f"{val}{unit}", fontsize=7.5, fontname="helv", color=(0.4, 0.4, 0.4))

    # Draw Bars
    bar_width = (chart_w / len(categories)) * 0.55
    spacing = (chart_w / len(categories))

    for i, (cat, val) in enumerate(zip(categories, values)):
        bx = start_bar_x + (i * spacing) + (spacing * 0.22)
        bh = (val / max_val) * chart_h
        by = chart_bottom - bh

        # Bar fill
        color_fill = (0.08, 0.45, 0.35) if val > 75 else ((0.85, 0.4, 0.15) if val < 72 else (0.15, 0.35, 0.55))
        page.draw_rect(fitz.Rect(bx, by, bx + bar_width, chart_bottom), fill=color_fill, color=None)

        # Label value on top of bar
        page.insert_text(fitz.Point(bx - 2, by - 5), f"{val}{unit}", fontsize=8, fontname="helv", color=(0.1, 0.1, 0.1))
        # Category label under bar
        page.insert_text(fitz.Point(bx - 6, chart_bottom + 14), cat[:10], fontsize=7.5, fontname="helv", color=(0.25, 0.25, 0.25))


def create_q2_pdf():
    pdf_path = UPLOADS_DIR / "Operations_Q2_Performance.pdf"
    doc = fitz.open()

    # --- Page 1 ---
    page1 = doc.new_page(width=595, height=842)
    draw_header_bar(page1, "Q2 Manufacturing & Operations Report", "Global Production Audit & KPI Benchmark", "June 30, 2026", "OPS-2026-Q2")

    y = 85
    # Executive Summary Text
    page1.insert_text(fitz.Point(36, y), "1. Executive Summary & Operational Baseline", fontsize=12, fontname="helv", color=(0.05, 0.25, 0.2))
    y += 18
    exec_summary = (
        "During the second quarter (Q2), factory operations exhibited strong baseline performance across all three\n"
        "manufacturing hubs. Average production efficiency achieved 82.5%, supported by streamlined supply chain\n"
        "schedules and stable microcontroller inventory. Overall factory output reached 12,500 finished assemblies,\n"
        "while unplanned equipment downtime remained limited to 15 aggregate facility days."
    )
    for line in exec_summary.split("\n"):
        page1.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.2, 0.25, 0.25))
        y += 14

    y += 15
    # Table 1: Q2 Manufacturing Performance
    headers = ["Facility / Plant", "Output (Units)", "Operating Efficiency", "Downtime (Days)", "Operating Expense"]
    rows = [
        ["Plant Alpha (Facility 1)", "4,200", "84.5%", "4 Days", "$1,250,000"],
        ["Plant Beta (Facility 2)", "3,800", "82.0%", "6 Days", "$1,100,000"],
        ["Plant Gamma (Facility 3)", "4,500", "81.0%", "5 Days", "$1,400,000"],
        ["Total / Portfolio Average", "12,500", "82.5%", "15 Days", "$3,750,000"]
    ]
    col_w = [140, 85, 105, 95, 95]
    y = draw_table(page1, y, headers, rows, col_w, "Table 1: Q2 Operational Metrics & Line Throughput")

    # Supply Chain Sourcing
    page1.insert_text(fitz.Point(36, y), "2. Supply Chain Lead Times & Semiconductor Buffer", fontsize=11, fontname="helv", color=(0.05, 0.25, 0.2))
    y += 16
    sc_text = (
        "- Microcontroller buffer inventory: 45 days of continuous operations maintained without disruption.\n"
        "- Supplier on-time delivery metric: 96.4% across tier-1 semiconductor and passive component vendors.\n"
        "- Average replenishment lead time: 3.2 days from warehouse dispatch to assembly line staging."
    )
    for line in sc_text.split("\n"):
        page1.insert_text(fitz.Point(36, y), line, fontsize=9, fontname="helv", color=(0.25, 0.25, 0.25))
        y += 14

    y += 15
    # Chart: Q2 Efficiency by Facility
    draw_bar_chart(page1, 36, y, 520, 180, "Figure 1: Q2 Production Efficiency by Manufacturing Plant (%)", ["Alpha", "Beta", "Gamma", "Target"], [84.5, 82.0, 81.0, 80.0], 100, "%")

    # --- Page 2 ---
    page2 = doc.new_page(width=595, height=842)
    draw_header_bar(page2, "Q2 Equipment Maintenance & Reliability Audit", "Section 3: CNC Machining & Process Automation", "June 30, 2026", "OPS-2026-Q2")

    y = 85
    page2.insert_text(fitz.Point(36, y), "3. Equipment Availability & CNC Utilization Analysis", fontsize=12, fontname="helv", color=(0.05, 0.25, 0.2))
    y += 18
    eq_text = (
        "Preventative maintenance protocols conducted during scheduled weekend windows prevented cascading\n"
        "line stoppages. All precision CNC units and automated optical inspection (AOI) cells operated above\n"
        "the 98.5% uptime threshold with zero emergency hydraulic breakdowns."
    )
    for line in eq_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.2, 0.25, 0.25))
        y += 14

    y += 15
    # Table 2: Machine Uptime
    m_headers = ["Machine Cell", "Operating Hours", "Maintenance (hrs)", "Availability Uptime", "Failure Events"]
    m_rows = [
        ["CNC Milling Group Alpha", "1,420 hrs", "12 hrs", "99.1%", "0 Critical"],
        ["CNC Lathe Cell Beta", "1,380 hrs", "14 hrs", "98.9%", "0 Critical"],
        ["Automated Optical (AOI)", "1,500 hrs", "8 hrs", "99.4%", "0 Critical"],
        ["Composite Machine Total", "4,300 hrs", "34 hrs", "99.2%", "0 Critical"]
    ]
    y = draw_table(page2, y, m_headers, m_rows, [140, 95, 100, 95, 90], "Table 2: Machine Group Maintenance & Availability (Q2)")

    # Mathematical baseline
    page2.insert_text(fitz.Point(36, y), "4. Mathematical Metrics & Efficiency Calculation Formulation", fontsize=11, fontname="helv", color=(0.05, 0.25, 0.2))
    y += 16
    math_text = (
        "Production Efficiency is calculated using standard manufacturing OEE formulation:\n"
        "  Efficiency = (Actual Output / Theoretical Max Capacity) * (Operating Hours / Scheduled Hours) * 100%\n"
        "  Q2 Baseline Value = 82.5%\n"
        "  Q2 Aggregate Operating Cost = $3,750,000 for 12,500 Units ($300.00 / Unit cost baseline)."
    )
    for line in math_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9, fontname="helv", color=(0.25, 0.25, 0.25))
        y += 14

    doc.save(str(pdf_path))
    doc.close()
    print("Generated:", pdf_path)
    return str(pdf_path)


def create_q4_pdf():
    pdf_path = UPLOADS_DIR / "Operations_Q4_Performance.pdf"
    doc = fitz.open()

    # --- Page 1 ---
    page1 = doc.new_page(width=595, height=842)
    draw_header_bar(page1, "Q4 Manufacturing & Operations Report", "Global Production Audit & Variance Analysis", "December 31, 2026", "OPS-2026-Q4")

    y = 85
    page1.insert_text(fitz.Point(36, y), "1. Executive Summary & Operational Variance", fontsize=12, fontname="helv", color=(0.05, 0.25, 0.2))
    y += 18
    exec_summary = (
        "Fourth-quarter (Q4) operations experienced severe production headwinds resulting in an efficiency\n"
        "decline from 82.5% in Q2 to 70.8% in Q4 (an absolute reduction of -11.7%, representing a relative drop\n"
        "of -14.18%). Total factory volume decreased to 10,500 assemblies, while operating expenses escalated\n"
        "to $4,150,000 due to expedited freight and overtime maintenance labor."
    )
    for line in exec_summary.split("\n"):
        page1.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.2, 0.25, 0.25))
        y += 14

    y += 15
    # Table 1: Q4 Manufacturing Performance
    headers = ["Facility / Plant", "Output (Units)", "Operating Efficiency", "Downtime (Days)", "Operating Expense"]
    rows = [
        ["Plant Alpha (Facility 1)", "3,600", "72.0%", "12 Days", "$1,380,000"],
        ["Plant Beta (Facility 2)", "3,100", "69.5%", "15 Days", "$1,220,000"],
        ["Plant Gamma (Facility 3)", "3,800", "71.0%", "11 Days", "$1,550,000"],
        ["Total / Portfolio Average", "10,500", "70.8%", "38 Days", "$4,150,000"]
    ]
    col_w = [140, 85, 105, 95, 95]
    y = draw_table(page1, y, headers, rows, col_w, "Table 1: Q4 Operational Metrics & Line Throughput")

    # Supply Chain Bottlenecks
    page1.insert_text(fitz.Point(36, y), "2. Root Cause 1: Semiconductor Delivery Delays", fontsize=11, fontname="helv", color=(0.65, 0.2, 0.1))
    y += 16
    sc_text = (
        "- Critical microcontroller inventory depleted to 0 days during October and November.\n"
        "- 18 full facility days lost to idle staging waiting for expedited component shipments.\n"
        "- Expedited logistics costs added $185,000 in unbudgeted air freight surcharges."
    )
    for line in sc_text.split("\n"):
        page1.insert_text(fitz.Point(36, y), line, fontsize=9, fontname="helv", color=(0.25, 0.25, 0.25))
        y += 14

    y += 15
    # Chart: Q4 Efficiency by Facility
    draw_bar_chart(page1, 36, y, 520, 180, "Figure 1: Q4 Production Efficiency Decline by Manufacturing Plant (%)", ["Alpha", "Beta", "Gamma", "Target"], [72.0, 69.5, 71.0, 80.0], 100, "%")

    # --- Page 2 ---
    page2 = doc.new_page(width=595, height=842)
    draw_header_bar(page2, "Q4 Equipment Failures & Root Cause Synthesis", "Section 3: Downtime Breakdown & Corrective Plan", "December 31, 2026", "OPS-2026-Q4")

    y = 85
    page2.insert_text(fitz.Point(36, y), "3. Root Cause 2 & 3: CNC Hydraulic Failures & AOI Inspection Shifts", fontsize=12, fontname="helv", color=(0.05, 0.25, 0.2))
    y += 18
    eq_text = (
        "Plant Beta (Facility 2) sustained 42 hours of unscheduled hydraulic fluid seal maintenance in November,\n"
        "forcing an emergency shutdown of CNC Milling cells. Concurrently, the introduction of a new automated optical\n"
        "inspection (AOI) sensor array required extensive recalibration, slowing line throughput by 14%."
    )
    for line in eq_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9.5, fontname="helv", color=(0.2, 0.25, 0.25))
        y += 14

    y += 15
    # Table 2: Machine Uptime
    m_headers = ["Machine Cell", "Operating Hours", "Maintenance (hrs)", "Availability Uptime", "Failure Events"]
    m_rows = [
        ["CNC Milling Group Alpha", "1,180 hrs", "56 hrs", "95.4%", "2 Hydraulic"],
        ["CNC Lathe Cell Beta", "1,120 hrs", "48 hrs", "95.9%", "1 Electrical"],
        ["Automated Optical (AOI)", "1,250 hrs", "38 hrs", "97.0%", "3 Sensor Drift"],
        ["Composite Machine Total", "3,550 hrs", "142 hrs", "96.1%", "6 Critical"]
    ]
    y = draw_table(page2, y, m_headers, m_rows, [140, 95, 100, 95, 90], "Table 2: Machine Group Maintenance & Availability (Q4)")

    # Mathematical Verification
    page2.insert_text(fitz.Point(36, y), "4. Mathematical Verification of Quarterly Variance (Q2 vs Q4)", fontsize=11, fontname="helv", color=(0.05, 0.25, 0.2))
    y += 16
    math_text = (
        "Cross-Quarter Variance Calculations:\n"
        "  - Efficiency Drop: Delta = 70.8% - 82.5% = -11.7% (Absolute Decrease)\n"
        "  - Relative Efficiency Change = (-11.7% / 82.5%) * 100% = -14.18%\n"
        "  - Total Volume Reduction: 12,500 Units - 10,500 Units = -2,000 Units (-16.0%)\n"
        "  - Cost Inflation: $4,150,000 - $3,750,000 = +$400,000 (+10.67% increase in operating expenses)\n"
        "  - Unit Cost Spike: $4,150,000 / 10,500 = $395.24/unit (vs $300.00/unit in Q2, +31.75% increase)."
    )
    for line in math_text.split("\n"):
        page2.insert_text(fitz.Point(36, y), line, fontsize=9, fontname="helv", color=(0.25, 0.25, 0.25))
        y += 14

    doc.save(str(pdf_path))
    doc.close()
    print("Generated:", pdf_path)
    return str(pdf_path)


if __name__ == "__main__":
    p1 = create_q2_pdf()
    p2 = create_q4_pdf()
    
    # Immediately ingest and index both PDFs into the system
    from ingestion.universal_parser import ingest_any_file
    from retrieval.indexer import index_document

    res1 = ingest_any_file(p1, output_base_dir=str(BACKEND_DIR / "data"))
    cnt1 = index_document(res1, index_dir=str(BACKEND_DIR / "data" / "index"))
    print(f"Ingested and indexed {os.path.basename(p1)}: {cnt1} evidence items.")

    res2 = ingest_any_file(p2, output_base_dir=str(BACKEND_DIR / "data"))
    cnt2 = index_document(res2, index_dir=str(BACKEND_DIR / "data" / "index"))
    print(f"Ingested and indexed {os.path.basename(p2)}: {cnt2} evidence items.")
