# Multimodal Document Intelligence (HNX26PSI01)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash%20VLM-8E75B2.svg?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![PyMuPDF](https://img.shields.io/badge/Document%20AI-PyMuPDF%20%2B%20pdfplumber-FF6F00.svg?style=flat)](https://pymupdf.readthedocs.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Submission for Problem Statement HNX26PSI01: Multimodal Document Intelligence**  
> *Generative AI · Vision-Language Models · Multimodal RAG · Document AI*

A production-grade, full-stack Multimodal Document Intelligence platform capable of reading mixed documents (PDFs with text, multi-column layouts, tables, vector charts, scanned pages, and figures) and answering complex cross-document inquiries with **pixel-level visual citations, verified mathematical computations, and interactive chart decompilation**.

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [Compliance with Key Hackathon Rules](#-compliance-with-key-hackathon-rules)
3. [Architecture Overview & System Flow](#-architecture-overview--system-flow)
4. [Data Pipeline & Ingestion Architecture](#-data-pipeline--ingestion-architecture)
5. [Core Models & Reasoning Engine](#-core-models--reasoning-engine)
6. [Novelty Features & Competitive Differentiators](#-novelty-features--competitive-differentiators)
7. [Representative Sample Input & Output (Benchmark Walkthrough)](#-representative-sample-input--output-benchmark-walkthrough)
8. [Scope Note (MVP vs. Stretch Goals)](#-scope-note-mvp-vs-stretch-goals)
9. [Declared Resources & Dependencies](#-declared-resources--dependencies)
10. [Step-by-Step Installation & Quick Start](#-step-by-step-installation--quick-start)
11. [How to Reproduce Demonstrated Results](#-how-to-reproduce-demonstrated-results)
12. [Project Repository Layout](#-project-repository-layout)

---

## 🎯 Executive Summary & Problem Statement

Enterprises struggle with fragmented documents where critical insights are trapped across textual paragraphs, tabular financial matrices, and flattened graphics. Traditional text-based RAG engines completely fail on such documents because:
1. **Charts & Graphs are completely lost** or reduced to empty placeholders (`[Image]`).
2. **Tables lose spatial row/column alignment**, breaking cell-level reasoning.
3. **LLMs hallucinate arithmetic** when computing metrics like percentage variances or growth rates.
4. **Citations are vague or missing**, giving zero verification proof to auditors.

### What This System Solves
Our platform implements **Dual-Stream Visual Document RAG with a Live Evidence Inspector**:
* Automatically extracts and indexes both textual blocks and visual elements (charts, tables, diagrams).
* Directly submits cropped chart images into a **Vision-Language Model (Gemini 2.0 Flash)** to inspect axes, legends, bars, and trends.
* Verifies numerical calculations via a **deterministic Python AST Math Runtime** (eliminating math hallucination).
* Displays side-by-side **visual bounding box overlays on high-resolution rendered original PDF pages** for 100% source auditability.

---

## ⚖️ Compliance with Key Hackathon Rules

| Hackathon Rule | How Our System Strictly Complies | Verification Evidence |
| :--- | :--- | :--- |
| **Rule 1: Mandatory Source Attribution**<br>*"Every answer must point to where it came from (which document, which page, which section). An answer with no source = no points."* | Every claim and metric in our answer is tagged with an exact citation badge: `[Doc: <name>, Page: <p>, Section: <s>]`. Uncited claims are rejected by a post-generation verification gate. | Citations return document name, 1-indexed page, section header, and `[x, y, w, h]` percentage bounding box coordinates. |
| **Rule 2: Genuine Visual Analysis**<br>*"If you need a chart or table to answer, you can't just read the text version. Visual content must actually be analyzed as visual."* | Charts and plots are cropped at 200–300 DPI and passed as binary image inputs into Gemini 2.0 Flash VLM. The model inspects visual attributes (bar heights, curve direction, axis titles). | Inverted chart analysis and the **Interactive Chart Decompiler** endpoint `/api/charts/decompile` prove visual feature extraction. |
| **Metric: Cross-Document Reasoning** | Hybrid retriever aggregates chunks across multiple distinct files (e.g. comparing `Operations_Q2_Report.pdf` and `Operations_Q4_Report.pdf`). | Synthesis engine computes cross-document deltas and triggers the **Cross-Document Conflict Detector**. |
| **Metric: Mathematical Accuracy** | Raw values extracted from tables and charts are evaluated through a sandboxed Python runtime. | Outputs explicit step-by-step formulas ($\Delta = Q_4 - Q_2, \% = \frac{\Delta}{Q_2} \times 100$). |
| **Metric: Handling Tricky / Scanned Docs** | Multi-level fallback: Native vector text $\rightarrow$ PDF drawing density analysis $\rightarrow$ PyMuPDF layout analysis $\rightarrow$ OCR engine fallback for scanned/tilted pages. | Successfully extracts content from damaged, low-contrast, or image-only pages. |

---

## 🏛️ Architecture Overview & System Flow

```
                      ┌──────────────────────────────────────────────┐
                      │          Multi-Document PDF Ingestion        │
                      │  (Multi-column, Scanned, Tables, Charts)     │
                      └──────────────────────┬───────────────────────┘
                                             │
                       PyMuPDF (fitz) / pdfplumber Rendering (200 DPI)
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │          Dual-Stream Extraction Engine        │
                     ├───────────────────────┬───────────────────────┤
                     │                       │                       │
                     ▼                       ▼                       ▼
            [Stream A: Text Blocks]     [Stream B: Tables]     [Stream C: Visual Elements]
            • Hierarchical blocks       • Structured HTML/     • Vector drawings & crops
            • Font & header detection     Markdown tables      • VLM Visual Captioning
            • [x0, y0, x1, y1] bbox     • Row & Col headers    • Axes, trends & data schema
                     │                       │                       │
                     └───────────────────────┼───────────────────────┘
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │     Multimodal Vector & Lexical Store   │
                        │  • Dense Vector: Google text-embedding  │
                        │  • Sparse Lexical: BM25 Token Index     │
                        │  • Reciprocal Rank Fusion (RRF: 60/40)  │
                        └────────────────────┬────────────────────┘
                                             │
                        User Query (Text / Speech / Visual Lasso)
                                             ▼
                     ┌───────────────────────────────────────────────┐
                     │         Multimodal Reasoning Engine           │
                     │  • Retrieves Top-K Text Chunks + Image Crops  │
                     │  • Multimodal VLM Prompting (Gemini 2.0 Flash)│
                     │  • Deterministic Python Math Sandbox Verifier │
                     │  • Inline Citation & Grounding Filter         │
                     └───────────────────────┬───────────────────────┘
                                             │
                                             ▼
           ┌───────────────────────────────────────────────────────────────────┐
           │                     Interactive Web Workspace                     │
           ├────────────────────────┬──────────────────────────────────────────┤
           │      Left / Chat       │               Right Panel                │
           │ • Grounded Answer      │ • High-Res Page Viewer with Zoom         │
           │ • Confidence Score     │ • Exact Bounding Box Overlays            │
           │ • Step-by-Step Math    │ • Interactive Chart Decompiler (to CSV)  │
           │ • Clickable Citations  │ • Cross-Document Discrepancy Modal       │
           └────────────────────────┴──────────────────────────────────────────┘
```

---

## 🔄 Data Pipeline & Ingestion Architecture

The ingestion pipeline (`backend/ingestion/pipeline.py`) processes raw documents through five deterministic phases:

1. **Document Registration & ID Generation:**
   - Computes an MD5 checksum of the file bytes and assigns a stable document identifier (e.g. `DOC_62C934`).
2. **High-Resolution Page Rendering (`ingestion/page_renderer.py`):**
   - Renders each page to a crisp 200 DPI PNG saved to `backend/data/pages/<doc_id>/page_<n>.png`. These images serve as the visual canvas for bounding box overlays.
3. **Layout & Text Extraction (`ingestion/text_extractor.py`):**
   - Extracts text blocks, detects font sizes to identify section headers, and computes normalized bounding coordinates `[x0, y0, x1, y1]`.
4. **Table Structure Extraction (`ingestion/table_extractor.py`):**
   - Detects grid lines using `pdfplumber` and `PyMuPDF` table finders, separating column headers and data rows into structured JSON matrices.
5. **Visual Content Detection & OCR Fallback (`ingestion/content_detector.py`, `ocr.py`):**
   - Analyzes vector path density and embedded image metadata to distinguish bar charts, line plots, and flow diagrams from decorative icons.
   - For image-only or scanned pages ($< 30$ characters of digital text), automatically falls back to OCR preprocessing.
6. **Persistent Indexing (`backend/retrieval/indexer.py`):**
   - Builds 768-dimensional dense vectors using Google Generative Language Embeddings and persists document metadata to `backend/data/index/metadata.json` and `index.npy`.

---

## 🧠 Core Models & Reasoning Engine

### 1. Vision-Language Model (VLM)
* **Model:** `gemini-2.0-flash` (with fallback support for `gemini-1.5-pro` and `gemini-1.5-flash`).
* **Purpose:** Inspects high-resolution cropped images of charts and tables alongside contextual paragraphs. The model reads coordinate labels, compares bar heights, extracts trendlines, and detects visual anomalies.

### 2. Dense Semantic Embedding Model
* **Model:** Google `text-embedding-004` (768 dimensions).
* **Purpose:** Encodes user queries and document chunks into a continuous vector space for high-recall semantic matching.

### 3. Sparse Lexical Search & Hybrid Fusion
* **Algorithm:** BM25 with numerical token boosting.
* **Fusion:** Reciprocal Rank Fusion (RRF) with 60% semantic weight and 40% exact numerical/quarter keyword weighting ($k = 60$). Guarantees exact matches for metric names like *"Q4"*, *"EBITDA"*, or *"70.8%"*.

### 4. Deterministic Python Math Sandbox
* **Implementation:** AST-parsed Python execution environment.
* **Purpose:** Eliminates LLM arithmetic hallucinations. Formulas such as variances, growth rates, and counterfactual sensitivities are evaluated programmatically in Python before being returned to the user.

---

## 🚀 Novelty Features & Competitive Differentiators

### 🌟 1. Interactive Chart Decompiler (`POST /api/charts/decompile`)
* **The Innovation:** In most enterprise PDFs, charts are "dead pixels" with unreachable underlying data.
* **Our Solution:** A 1-click **"Decompile Chart to CSV / Table"** feature in the Evidence Panel. The VLM reconstructs the complete data table from visual pixels, producing:
  - An interactive, editable HTML table.
  - A downloadable CSV dataset.
  - An interactive Plotly/Recharts specification.

### 🌟 2. Visual Lasso: Point-and-Ask Spatial Querying (`POST /api/spatial/query`)
* **The Innovation:** Users don't always know the terminology to search for when looking at an unfamiliar curve or diagram.
* **Our Solution:** The user draws a box on any page anomaly in the UI and asks *"Why is this bar lower?"*. The backend extracts the region, inspects the crop, and triggers an inverted cross-page search to find the root cause paragraphs on other pages.

### 🌟 3. What-If Counterfactual Scenario Simulator (`POST /api/simulate/counterfactual`)
* **The Innovation:** Traditional RAG only answers historical questions (*"What happened?"*). Decision-makers need to know: *"What if...?"*.
* **Our Solution:** Users can test hypothetical scenarios (e.g. *"What if downtime was 5 days instead of 18 days?"*). The system models causal sensitivity using linear and proportional elasticity:
  $$\text{Loss Rate} = \frac{11.7\%}{18 \text{ days}} = 0.65\%/\text{day} \implies \text{Projected Q4 Efficiency} = 70.8\% + (13 \times 0.65\%) = 79.25\%$$

### 🌟 4. Cross-Document Conflict & Discrepancy Engine (`GET /api/documents/conflicts`)
* **The Innovation:** Documents often contradict each other (e.g., preliminary draft memo vs. certified audit).
* **Our Solution:** An automated discrepancy detector flags conflicting assertions across documents, compares publication timestamps, establishes precedence, and displays an audit comparison in the **Conflict Modal**.

---

## 📊 Representative Sample Input & Output (Benchmark Walkthrough)

### Input Question:
> *"Compare production efficiency between Q2 and Q4, identify the three biggest reasons for the change, and show me the proof."*

### System Output:

#### 1. Executive Summary
> Comparing operational metrics across **Operations_Q2_Report.pdf** and **Operations_Q4_Report.pdf**, production efficiency dropped from **82.5% in Q2** to **70.8% in Q4**, representing an absolute decrease of **11.7%** (a relative decline of **-14.18%**) `[Doc: Operations_Q2_Report.pdf, Page: 4, Section: Manufacturing KPI Chart]` `[Doc: Operations_Q4_Report.pdf, Page: 2, Section: Quarterly Financial & Operational Summary]`.

#### 2. Three Biggest Reasons for the Change
1. **Supply Chain Semiconductor Bottlenecks:** Critical microcontroller shortages led to 18 idle factory days in October–November `[Doc: Operations_Q4_Report.pdf, Page: 5, Section: Root Cause Analysis]`.
2. **Unscheduled CNC Machine Downtime:** Facility 2 experienced 42 hours of unplanned hydraulic maintenance during peak line speeds `[Doc: Operations_Q4_Report.pdf, Page: 6, Section: Equipment Reliability]`.
3. **Workforce Re-training Shift:** Introduction of the automated optical inspection (AOI) cell in November reduced hourly throughput during calibration `[Doc: Operations_Q4_Report.pdf, Page: 7, Section: Process Automation]`.

#### 3. Mathematical Verification (Python AST Evaluated)
* **Q2 Baseline Efficiency:** `82.5%` *(Visual Bar Peak Extraction)* `[Doc: Operations_Q2_Report.pdf, Page: 4]`
* **Q4 Final Efficiency:** `70.8%` *(Table Cell Extraction)* `[Doc: Operations_Q4_Report.pdf, Page: 2]`
* **Absolute Variance Formula:** $\Delta = 70.8\% - 82.5\% = -11.7\text{ percentage points}$
* **Relative Percentage Change:** $\frac{70.8 - 82.5}{82.5} \times 100\% = -14.18\%$

#### 4. Grounded Visual Evidence (Clickable in UI)
* **Citation 1:** `Operations_Q2_Report.pdf` · Page 4 · *Manufacturing KPI Chart* · **Type: Chart** · Confidence: 98% · Bounding Box: `[12.0%, 25.0%, 75.0%, 35.0%]`
* **Citation 2:** `Operations_Q4_Report.pdf` · Page 2 · *Summary Matrix* · **Type: Table** · Confidence: 97% · Bounding Box: `[10.0%, 18.0%, 78.0%, 30.0%]`
* **Citation 3:** `Operations_Q4_Report.pdf` · Page 5 · *Section 3.2: Downtime Log* · **Type: Text** · Confidence: 95% · Bounding Box: `[12.0%, 48.0%, 75.0%, 20.0%]`

---

## 🔭 Scope Note (MVP vs. Stretch Goals)

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│       MINIMUM VIABLE SOLUTION (MVP)          │         COMPLETED STRETCH GOALS              │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ ✅ End-to-end PDF upload & ingestion         │ 🌟 Interactive Chart Decompiler (PNG -> CSV) │
│ ✅ High-res page rendering (200 DPI PNGs)    │ 🌟 What-If Counterfactual Scenario Simulator │
│ ✅ Text & table extraction with coordinates  │ 🌟 Cross-Document Discrepancy & Conflict Hub │
│ ✅ Hybrid retrieval (Dense Vector + BM25)    │ 🌟 Deterministic Python AST Math Evaluator   │
│ ✅ Gemini VLM visual prompt synthesis        │ 🌟 Visual Lasso Point-and-Ask Spatial API    │
│ ✅ Strict inline citation enforcement        │ 🌟 Multilingual i18n UI (English/Tamil/Hindi)│
│ ✅ Pixel-level bounding box overlays in UI   │ 🌟 Web Speech API Voice Query Support        │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 📦 Declared Resources & Dependencies

In accordance with Hackathon evaluation transparency guidelines:

* **Foundation Models & APIs:** Google Gemini 2.0 Flash (`gemini-2.0-flash`) via Google AI Studio API; Google `text-embedding-004`.
* **Backend Libraries:** FastAPI 0.110+, Uvicorn, PyMuPDF 1.28+, pdfplumber, Pillow, NumPy, Pydantic v2, HTTPX, python-dotenv.
* **Frontend Libraries:** React 19, Vite 8, TypeScript, Tailwind CSS, Lucide React icons, Web Speech API.
* **Datasets & Documents:** Real and curated operational reports (`production_report.pdf`, `Operations_Q2_Report.pdf`, `Operations_Q4_Report.pdf`).

---

## 🛠️ Step-by-Step Installation & Quick Start

### Prerequisites
* **Python:** 3.10 or higher
* **Node.js:** v18.0.0 or higher (`npm` installed)
* **Git:** Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/jeslin-star-14/Multimodal-Document-Intelligence.git
cd Multimodal-Document-Intelligence
git checkout rag-backend
```

### 2. Configure Backend Environment
Navigate to `backend/` and configure your Gemini API key:
```bash
cd backend
cp .env.example .env
```
Edit `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VLM_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-004
```
*(Note: If no API key is provided, the backend automatically uses its built-in offline engine so all endpoints work without failure).*

### 3. Install Backend Dependencies & Start Server
```bash
pip install -r requirements.txt
python main.py
```
* Backend runs at: `http://localhost:8000`
* Interactive API Documentation (Swagger): `http://localhost:8000/docs`

### 4. Install Frontend Dependencies & Start Client
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
* Open your browser at: `http://localhost:5173`

---

## 🧪 How to Reproduce Demonstrated Results

### Option A: Via the Web Interface (`http://localhost:5173`)
1. Open `http://localhost:5173`.
2. Upload any PDF document via the attachment icon in the chat input or drag-and-drop.
3. Observe live pipeline states: `Parsing` $\rightarrow$ `Extracting text & visual tokens` $\rightarrow$ `Ready`.
4. Enter the prompt:  
   *"Compare production efficiency between Q2 and Q4, identify the three biggest reasons for the change, and show me the proof."*
5. Click on any citation badge in the answer to highlight the exact visual bounding box on the original document page viewer in the Evidence Panel.
6. Switch to the **Chart / Image** tab and click **"Decompile Chart to CSV / Table"** to see extracted numbers.

### Option B: Via Terminal CLI Test Script
Run our automated benchmark test script:
```bash
python backend/demo_test.py
```
This script exercises retrieval, Gemini VLM synthesis, math verification, and visual citation extraction end-to-end, printing the complete structured output.

### Option C: Via Interactive API Docs (`http://localhost:8000/docs`)
1. Open `http://localhost:8000/docs`.
2. Try `POST /api/chat/query` with `{"query": "Compare Q2 and Q4 efficiency"}`.
3. Try `POST /api/charts/decompile` with `{"chart_title": "Production Efficiency"}`.
4. Try `POST /api/simulate/counterfactual` with `{"baseline_value": 70.8, "scenario_description": "Downtime cut to 5 days"}`.

---

## 📂 Project Repository Layout

```text
Multimodal-Document-Intelligence/
├── frontend/                          # Client Workspace (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx             # Navigation, Language (EN/TA/HI) & Theme Toggle
│   │   │   ├── DocumentPanel/         # Document List, Uploader, & Insights Cards
│   │   │   ├── ChatPanel/             # Conversational UI, Voice Input, Citation Chips
│   │   │   ├── EvidencePanel/         # High-Res Page Viewer & Bounding Box Overlays
│   │   │   └── ConflictModal/         # Cross-Document Discrepancy Inspection Modal
│   │   ├── types/index.ts             # Shared Frontend & Grounding Type Definitions
│   │   ├── translations/i18n.ts       # Multilingual Dictionaries (English, Tamil, Hindi)
│   │   ├── App.tsx                    # Layout Coordinator & Live API State Machine
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                           # API, Ingestion & Reasoning Engine
│   ├── app/
│   │   ├── models/schemas.py          # Unified Pydantic Schemas (Dual Frontend/Backend)
│   │   ├── config.py                  # Environment & Path Configuration
│   │   ├── retriever.py               # Hybrid Vector & BM25 Reciprocal Rank Fusion
│   │   ├── reasoning.py               # Multimodal VLM Synthesizer & Python Math Verifier
│   │   └── parser.py                  # High-Res Visual Region Cropping
│   ├── ingestion/                     # Document AI Pipeline
│   │   ├── pipeline.py                # End-to-end PDF Ingestion Pipeline
│   │   ├── pdf_parser.py              # PyMuPDF / fitz & pypdf Dual Engine
│   │   ├── page_renderer.py           # 200 DPI Page Image Renderer
│   │   ├── text_extractor.py          # Coordinate-aware Text & Header Extractor
│   │   ├── table_extractor.py         # Tabular Structure Grid Extractor
│   │   ├── content_detector.py        # Vector Drawing & Chart Classifier
│   │   └── ocr.py                     # Scanned Document Fallback OCR Engine
│   ├── retrieval/                     # Search & Indexing Engine
│   │   ├── indexer.py                 # Vector Index Persistence (index.npy & metadata.json)
│   │   ├── embeddings.py              # Google text-embedding-004 Client
│   │   └── retriever.py               # Hybrid Retrieval Logic & Numerical Boosting
│   ├── data/                          # Data Storage (Uploads, Rendered Pages, Crops)
│   ├── demo_test.py                   # Verified End-to-End Test Runner
│   ├── main.py                        # Unified FastAPI Application (Endpoints & Novelty)
│   ├── requirements.txt               # Backend Python Dependencies
│   └── .env.example                   # Environment Configuration Template
│
├── LICENSE                            # MIT Open Source License
└── README.md                          # Comprehensive Hackathon Submission Documentation
```

---

## 👥 Team & Development Roles

* **Member 1 (Tech Lead / Multimodal RAG & Reasoning):** Gemini VLM prompt orchestration, hybrid retriever, deterministic Python AST math engine, API routing, and novelty endpoints (`rag-backend`).
* **Member 2 (Data Pipeline & Document Vision Lead):** PDF parsing (`PyMuPDF`), table extraction, visual content detection, and OCR fallback (`Document-Ingestion`).
* **Member 3 (Frontend & Evidence Inspector Lead):** Split-screen React workspace, bounding box overlays, voice input, and theme/i18n engineering (`frontend`).
* **Member 4 (QA, Benchmark Dataset & Submission Lead):** Document curation, test scenarios, benchmark prompts, and submission documentation.

---

*Built with passion for HNX26PSI01: Multimodal Document Intelligence.*