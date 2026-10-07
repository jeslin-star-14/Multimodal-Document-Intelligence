import type { DocumentItem, DocumentChunk, ChatMessage, ConflictRecord } from '../types';

// Mock Page Previews as rich SVG data URIs so they load reliably without external dependencies
export const mockPageSvgPreview = (pageNumber: number, title: string, subtitle: string, chartOrTable: 'chart' | 'table' | 'invoice') => {
  let contentSvg = '';
  if (chartOrTable === 'chart') {
    contentSvg = `
      <rect x="50" y="240" width="500" height="280" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <text x="70" y="275" fill="#f8fafc" font-size="16" font-weight="bold">Quarterly Revenue Growth (FY2025-26)</text>
      <!-- Bars -->
      <rect x="100" y="420" width="60" height="70" rx="4" fill="#6366f1"/>
      <text x="110" y="410" fill="#94a3b8" font-size="12">Q1: ₹2.8M</text>
      <text x="115" y="510" fill="#cbd5e1" font-size="13">Q1</text>

      <rect x="200" y="380" width="60" height="110" rx="4" fill="#6366f1"/>
      <text x="210" y="370" fill="#94a3b8" font-size="12">Q2: ₹3.4M</text>
      <text x="215" y="510" fill="#cbd5e1" font-size="13">Q2</text>

      <rect x="300" y="300" width="60" height="190" rx="4" fill="#10b981"/>
      <text x="300" y="290" fill="#34d399" font-size="13" font-weight="bold">Q3: ₹4.2M ★</text>
      <text x="315" y="510" fill="#cbd5e1" font-size="13" font-weight="bold">Q3</text>

      <rect x="400" y="330" width="60" height="160" rx="4" fill="#6366f1"/>
      <text x="410" y="320" fill="#94a3b8" font-size="12">Q4: ₹3.9M</text>
      <text x="415" y="510" fill="#cbd5e1" font-size="13">Q4</text>
    `;
  } else if (chartOrTable === 'table') {
    contentSvg = `
      <rect x="50" y="230" width="500" height="260" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <text x="70" y="265" fill="#f8fafc" font-size="16" font-weight="bold">Product Line Performance Breakdown</text>
      <line x1="50" y1="285" x2="550" y2="285" stroke="#475569" stroke-width="1.5"/>
      <text x="70" y="310" fill="#94a3b8" font-size="12" font-weight="600">PRODUCT</text>
      <text x="220" y="310" fill="#94a3b8" font-size="12" font-weight="600">UNITS</text>
      <text x="340" y="310" fill="#94a3b8" font-size="12" font-weight="600">REVENUE</text>
      <text x="460" y="310" fill="#94a3b8" font-size="12" font-weight="600">MARGIN</text>
      <line x1="50" y1="325" x2="550" y2="325" stroke="#334155" stroke-width="1"/>
      
      <text x="70" y="355" fill="#e2e8f0" font-size="13">Enterprise AI Core</text>
      <text x="220" y="355" fill="#e2e8f0" font-size="13">1,420</text>
      <text x="340" y="355" fill="#10b981" font-size="13" font-weight="600">₹2.60M</text>
      <text x="460" y="355" font-size="13">68.5%</text>

      <text x="70" y="395" fill="#e2e8f0" font-size="13">Vision Analytics</text>
      <text x="220" y="395" fill="#e2e8f0" font-size="13">890</text>
      <text x="340" y="395" fill="#10b981" font-size="13" font-weight="600">₹1.15M</text>
      <text x="460" y="395" font-size="13">54.2%</text>

      <text x="70" y="435" fill="#e2e8f0" font-size="13">Edge Gateway Pro</text>
      <text x="220" y="435" fill="#e2e8f0" font-size="13">450</text>
      <text x="340" y="435" fill="#10b981" font-size="13" font-weight="600">₹0.45M</text>
      <text x="460" y="435" font-size="13">41.0%</text>
    `;
  } else {
    contentSvg = `
      <rect x="50" y="220" width="500" height="300" rx="8" fill="#1e293b" stroke="#334155" stroke-width="2"/>
      <text x="70" y="255" fill="#f8fafc" font-size="16" font-weight="bold">INVOICE: #INV-2026-094</text>
      <text x="70" y="285" fill="#94a3b8" font-size="13">Billed To: Titan Industrial Systems Ltd.</text>
      <text x="70" y="310" fill="#94a3b8" font-size="13">Due Date: 15-Nov-2026</text>
      <line x1="70" y1="330" x2="530" y2="330" stroke="#475569" stroke-width="1"/>
      <text x="70" y="360" fill="#e2e8f0" font-size="14">Item: GPU Computing Cluster - 4x H100</text>
      <text x="430" y="360" fill="#e2e8f0" font-size="14">₹1,850,000</text>
      <text x="70" y="395" fill="#e2e8f0" font-size="14">GST @ 18%</text>
      <text x="430" y="395" fill="#e2e8f0" font-size="14">₹333,000</text>
      <line x1="70" y1="420" x2="530" y2="420" stroke="#475569" stroke-width="1"/>
      <text x="70" y="455" fill="#10b981" font-size="16" font-weight="bold">Total Amount Payable</text>
      <text x="400" y="455" fill="#10b981" font-size="16" font-weight="bold">₹2,183,000</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="100%" height="100%">
    <!-- Document Page Background -->
    <rect width="600" height="800" fill="#0f172a"/>
    <rect x="20" y="20" width="560" height="760" rx="8" fill="#131d31" stroke="#334155" stroke-width="1.5"/>
    
    <!-- Header -->
    <rect x="50" y="45" width="40" height="40" rx="8" fill="#4f46e5"/>
    <text x="63" y="70" fill="#ffffff" font-size="20" font-weight="bold">M</text>
    <text x="105" y="65" fill="#f8fafc" font-size="18" font-weight="bold">${title}</text>
    <text x="105" y="85" fill="#94a3b8" font-size="12">${subtitle}</text>
    <text x="500" y="65" fill="#64748b" font-size="12">Page ${pageNumber} of 8</text>
    <line x1="50" y1="100" x2="550" y2="100" stroke="#334155" stroke-width="1"/>

    <!-- Paragraph 1 -->
    <text x="50" y="130" fill="#e2e8f0" font-size="13" font-weight="600">1. Executive Overview & Multimodal Findings</text>
    <text x="50" y="155" fill="#94a3b8" font-size="12">This audit encompasses quarterly fiscal deliverables, operational telemetry, and invoice audits.</text>
    <text x="50" y="175" fill="#94a3b8" font-size="12">During Q3 fiscal review, strong enterprise demand propelled gross margins by 24% YoY.</text>
    <text x="50" y="195" fill="#94a3b8" font-size="12">Overall aggregate revenue across subsidiaries reached peak performance during Q3 FY25.</text>

    <!-- Specific Content (Chart / Table / Invoice) -->
    ${contentSvg}

    <!-- Footer notes -->
    <line x1="50" y1="720" x2="550" y2="720" stroke="#334155" stroke-width="1"/>
    <text x="50" y="745" fill="#64748b" font-size="11">Confidential · AI Grounded Intelligence Engine · Verified Bounding Box Grounding</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'FY25_Annual_Revenue_Report.pdf',
    size: '4.2 MB',
    type: 'pdf',
    pageCount: 8,
    uploadedAt: '10:45 AM',
    status: 'Ready',
    progress: 100,
    insights: {
      summary: 'Comprehensive annual fiscal review highlighting Q3 peak revenue of ₹4.2M, Enterprise AI adoption at 68.5% margin, and international market expansion.',
      keyEntities: [
        { category: 'Financial', value: '₹4.2M Q3 Sales' },
        { category: 'Financial', value: '₹14.3M Annual Total' },
        { category: 'Org', value: 'Titan Industrial Systems' },
        { category: 'Date', value: 'FY 2025-26' },
        { category: 'Metric', value: '68.5% Gross Margin' },
        { category: 'Location', value: 'Bangalore Tech Hub' }
      ],
      suggestedQuestions: [
        'Which quarter had the highest sales?',
        'What was the gross margin for Enterprise AI Core?',
        'Compare Q3 sales performance against Q1 and Q2'
      ]
    },
    pageImages: [
      mockPageSvgPreview(1, 'FY25 Executive Summary', 'Executive Overview', 'table'),
      mockPageSvgPreview(2, 'Operational Metrics', 'Telemetry Analysis', 'table'),
      mockPageSvgPreview(3, 'Product Line Performance', 'Revenue Breakdown', 'table'),
      mockPageSvgPreview(4, 'Regional Distribution', 'Geographical Sales', 'chart'),
      mockPageSvgPreview(5, 'Quarterly Revenue Performance', 'Visual Fiscal Chart 2', 'chart'),
      mockPageSvgPreview(6, 'Operating Expenses', 'Cost Allocation', 'table'),
      mockPageSvgPreview(7, 'Tax & Depreciation', 'Compliance Matrix', 'table'),
      mockPageSvgPreview(8, 'Auditor Sign-off', 'Governance Statement', 'table')
    ]
  },
  {
    id: 'doc-2',
    name: 'Invoice_INV_2026_094.png',
    size: '1.8 MB',
    type: 'image',
    pageCount: 1,
    uploadedAt: '10:48 AM',
    status: 'Ready',
    progress: 100,
    insights: {
      summary: 'Hardware procurement invoice for 4x NVIDIA H100 GPU compute cluster with 18% GST totaling ₹2,183,000 due Nov 15, 2026.',
      keyEntities: [
        { category: 'Financial', value: '₹2,183,000 Total' },
        { category: 'Org', value: 'Titan Industrial Systems Ltd.' },
        { category: 'Metric', value: '4x H100 GPU Cluster' },
        { category: 'Date', value: '15-Nov-2026' }
      ],
      suggestedQuestions: [
        'What is the total payable amount on invoice #INV-2026-094?',
        'What equipment was billed in this invoice?',
        'When is the invoice payment due?'
      ]
    },
    pageImages: [
      mockPageSvgPreview(1, 'Tax Invoice', 'Hardware Procurement Record', 'invoice')
    ]
  },
  {
    id: 'doc-3',
    name: 'Board_Meeting_Notes.docx',
    size: '840 KB',
    type: 'docx',
    pageCount: 3,
    uploadedAt: '10:50 AM',
    status: 'Ready',
    progress: 100,
    insights: {
      summary: 'Q3 Board deliberation minutes discussing initial estimate of Q3 revenues at ₹3.8M prior to final auditor reconciliation.',
      keyEntities: [
        { category: 'Org', value: 'Board of Directors' },
        { category: 'Financial', value: '₹3.8M Preliminary Est.' },
        { category: 'Date', value: 'October 2025' }
      ],
      suggestedQuestions: [
        'What preliminary revenue figure was discussed in the Board Meeting?',
        'Is there a discrepancy between Board Notes and the Final Audit Report?'
      ]
    },
    pageImages: [
      mockPageSvgPreview(1, 'Board Deliberation', 'Preliminary Minutes', 'table'),
      mockPageSvgPreview(2, 'Risk Analysis', 'Governance Discussion', 'table'),
      mockPageSvgPreview(3, 'Action Items', 'Resolutions Passed', 'table')
    ]
  }
];

export const mockChunks: DocumentChunk[] = [
  {
    id: 'chunk-chart-q3',
    documentId: 'doc-1',
    documentName: 'FY25_Annual_Revenue_Report.pdf',
    pageNumber: 5,
    type: 'chart',
    content: 'Quarterly Revenue Bar Chart (FY2025-26): Q1: ₹2.8M, Q2: ₹3.4M, Q3: ₹4.2M (Peak Quarter), Q4: ₹3.9M. Highest sales quarter achieved in Q3.',
    similarityScore: 0.94,
    boundingBox: {
      id: 'bbox-chart-1',
      x: 8.3,
      y: 30.0,
      width: 83.4,
      height: 35.0,
      label: 'Page 5 · Chart 2: Quarterly Sales (₹4.2M Peak)',
      type: 'chart',
      color: '#10b981'
    }
  },
  {
    id: 'chunk-table-products',
    documentId: 'doc-1',
    documentName: 'FY25_Annual_Revenue_Report.pdf',
    pageNumber: 3,
    type: 'table',
    content: 'Product Line Performance Table: Enterprise AI Core (1,420 units, ₹2.60M, 68.5% margin), Vision Analytics (890 units, ₹1.15M, 54.2% margin), Edge Gateway Pro (450 units, ₹0.45M, 41.0% margin).',
    rawTableData: {
      headers: ['Product', 'Units Sold', 'Revenue (₹)', 'Gross Margin'],
      rows: [
        ['Enterprise AI Core', '1,420', '₹2.60M', '68.5%'],
        ['Vision Analytics', '890', '₹1.15M', '54.2%'],
        ['Edge Gateway Pro', '450', '₹0.45M', '41.0%']
      ]
    },
    similarityScore: 0.88,
    boundingBox: {
      id: 'bbox-table-1',
      x: 8.3,
      y: 28.7,
      width: 83.4,
      height: 32.5,
      label: 'Page 3 · Table 1: Product Line Breakdown',
      type: 'table',
      color: '#6366f1'
    }
  },
  {
    id: 'chunk-text-exec',
    documentId: 'doc-1',
    documentName: 'FY25_Annual_Revenue_Report.pdf',
    pageNumber: 5,
    type: 'text',
    content: 'Executive Summary Paragraph 1: "During Q3 fiscal review, strong enterprise demand propelled gross margins by 24% YoY. Overall aggregate revenue across subsidiaries reached peak performance during Q3 FY25 at ₹4.2M."',
    similarityScore: 0.89,
    boundingBox: {
      id: 'bbox-text-1',
      x: 8.3,
      y: 16.2,
      width: 83.4,
      height: 10.0,
      label: 'Page 5 · Section 1.1: Executive Overview Text',
      type: 'text',
      color: '#3b82f6'
    }
  },
  {
    id: 'chunk-invoice-total',
    documentId: 'doc-2',
    documentName: 'Invoice_INV_2026_094.png',
    pageNumber: 1,
    type: 'image',
    content: 'Invoice #INV-2026-094 Billed to Titan Industrial Systems. Total Amount Payable: ₹2,183,000 (Includes ₹333,000 GST @ 18%). Item: GPU Computing Cluster - 4x H100.',
    similarityScore: 0.96,
    boundingBox: {
      id: 'bbox-inv-1',
      x: 8.3,
      y: 27.5,
      width: 83.4,
      height: 37.5,
      label: 'Page 1 · Invoice Breakdown & Total',
      type: 'image',
      color: '#ec4899'
    }
  }
];

export const mockConflicts: ConflictRecord[] = [
  {
    id: 'conf-1',
    topic: 'Q3 FY25 Stated Revenue Variance',
    claimA: {
      documentName: 'FY25_Annual_Revenue_Report.pdf',
      pageNumber: 5,
      statement: 'Audited Final Financial Report states Q3 revenue reached ₹4.2M with 24% YoY growth.',
      citationId: 'chunk-chart-q3'
    },
    claimB: {
      documentName: 'Board_Meeting_Notes.docx',
      pageNumber: 1,
      statement: 'Preliminary draft notes recorded estimated Q3 revenue as ₹3.8M prior to auditor sign-off.',
      citationId: 'doc-3'
    },
    variance: '₹400,000 difference between unverified Board draft and final audited filing.',
    severity: 'medium'
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    timestamp: '10:51 AM',
    text: 'Which quarter had the highest sales and what was the revenue?'
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    timestamp: '10:51 AM',
    text: 'Based on the multimodal analysis of **FY25_Annual_Revenue_Report.pdf**, **Q3** recorded the highest sales with a revenue of **₹4.2M** (growing 24% YoY). \n\nThe visual bar chart on Page 5 confirms Q3 as the peak quarter, followed by Q4 at ₹3.9M, Q2 at ₹3.4M, and Q1 at ₹2.8M.',
    confidenceScore: 94,
    citations: [
      {
        id: 'cite-1',
        documentId: 'doc-1',
        documentName: 'FY25_Annual_Revenue_Report.pdf',
        pageNumber: 5,
        chunkType: 'chart',
        label: 'Page 5 · Chart 2',
        chunkId: 'chunk-chart-q3',
        similarityScore: 0.94,
        boundingBox: {
          id: 'bbox-chart-1',
          x: 8.3,
          y: 30.0,
          width: 83.4,
          height: 35.0,
          label: 'Page 5 · Chart 2: Quarterly Sales (₹4.2M Peak)',
          type: 'chart',
          color: '#10b981'
        }
      },
      {
        id: 'cite-2',
        documentId: 'doc-1',
        documentName: 'FY25_Annual_Revenue_Report.pdf',
        pageNumber: 5,
        chunkType: 'text',
        label: 'Page 5 · Section 1.1',
        chunkId: 'chunk-text-exec',
        similarityScore: 0.89,
        boundingBox: {
          id: 'bbox-text-1',
          x: 8.3,
          y: 16.2,
          width: 83.4,
          height: 10.0,
          label: 'Page 5 · Section 1.1: Executive Overview Text',
          type: 'text',
          color: '#3b82f6'
        }
      }
    ],
    conflicts: mockConflicts
  }
];
