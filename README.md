# Multimodal Document Intelligence

> **Visual RAG with Pixel-Level Grounded Citations & Cross-Document Conflict Detection**

An enterprise-grade multimodal document intelligence platform that allows users to upload documents (PDF, DOCX, PPTX, Images), query them through text or speech, and inspect exact visual evidence (bounding boxes, extracted tables, and charts) on original document page previews.

---

## 📐 Architecture & Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Multimodal Document Intelligence        Language: [EN ▾]  [Upload]  │
├─────────────────────┬───────────────────────────┬──────────────────────────┤
│     DOCUMENTS       │           CHAT            │         EVIDENCE         │
│                     │                           │                          │
│ 📄 report.pdf (Ready)│ User: Which quarter had    │ Page 5 Grounding         │
│ 🖼️ invoice.png      │       the highest sales?  │ ┌──────────────────────┐ │
│ 📝 notes.docx       │                           │ │ [Original Document]  │ │
│                     │ AI: Q3 had the highest    │ │ ▓▓▓ [Highlighted]    │ │
│ ── Insights ──      │     sales at ₹4.2M.       │ └──────────────────────┘ │
│ • Executive Summary │ Confidence: 94% 🟢        │ Type: 📊 Chart · Sim: 94%│
│ • Key Entities      │ Sources: [Page 5·Chart 2] │                          │
│ • Suggested Queries │                           │ Tabs: [Text|Table|Image] │
│                     │ [Ask a question...] 🎙️ ➔  │                          │
└─────────────────────┴───────────────────────────┴──────────────────────────┘
```

---

## 🌟 Key Features

1. **Left: Document Panel**
   - Drag-and-drop uploader supporting PDF, DOCX, PPTX, PNG, JPG, TIFF.
   - Live pipeline progress bar (`Parsing` ➔ `OCR` ➔ `Embedding` ➔ `Ready`).
   - Automated Document Insights: Executive summary, categorized key entities (Financials, Orgs, Dates, Metrics), and clickable suggested questions.

2. **Middle: Grounded Chat Panel**
   - Conversational AI with streaming answers.
   - Confidence Badges: Green (High Grounding), Yellow (Moderate), Red (Low Evidence).
   - Clickable Citation Chips (e.g. `[Page 5 · Chart 2]`, `[Page 3 · Table 1]`) that dynamically control the Evidence Inspector.
   - Voice Input via Web Speech API.
   - "Not Found" state preventing hallucinations when evidence is weak.

3. **Right: Evidence Panel (Flagship Feature)**
   - High-fidelity original document page viewer with zoom and page navigation.
   - **Pixel-Level Bounding Box Overlays**: Exact highlight rectangles computed from document parser bounding boxes (`x`, `y`, `width`, `height` in %).
   - Multimodal Chunk Tabs:
     - 📝 **Text Chunks**: Raw text snippets with semantic similarity score.
     - 📊 **Table Chunks**: Formatted tabular views with row/column breakdown.
     - 🖼️ **Image/Chart Chunks**: Extracted chart visuals with captions.

4. **Cross-Document Conflict Detection**
   - Side-by-side comparison modal ("Doc A says X" vs "Doc B says Y") with severity indicator and source reconciliation.

5. **Internationalization (i18n) & Theme**
   - English (EN), Tamil (TA / தமிழ்), and Hindi (HI / हिन्दी).
   - Dark mode & Light mode toggle.

---

## 📁 Project Structure

```text
Multimodal-Document-Intelligence/
├── frontend/                     # React + Vite + TypeScript + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx        # Top navigation, language & theme controls
│   │   │   ├── DocumentPanel/    # Left panel (Uploader, List, Insights)
│   │   │   ├── ChatPanel/        # Middle chat (Bubbles, Citations, Voice)
│   │   │   ├── EvidencePanel/    # Right panel (Bounding box overlay, Chunks)
│   │   │   └── ConflictModal/    # Cross-document conflict inspector
│   │   ├── data/                 # Realistic mock multimodal documents & bounding boxes
│   │   ├── translations/         # English, Tamil, and Hindi i18n dictionaries
│   │   ├── types/                # TypeScript interfaces for RAG & Visual Grounding
│   │   ├── App.tsx               # Main layout coordinator
│   │   ├── index.css             # Tailwind design tokens & animations
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Python FastAPI RAG & Parsing Engine
│   ├── app/
│   │   ├── models/schemas.py     # Pydantic schemas (Chunks, BBoxes, Citations)
│   │   ├── services/parser.py    # Document parser & Bounding Box computation
│   │   └── routers/              # API endpoints
│   ├── main.py                   # FastAPI server entrypoint
│   └── requirements.txt
└── README.md
```

---

## 🚀 Quick Start

### 1. Run the Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 2. Run the Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive API documentation available at `http://localhost:8000/docs`.