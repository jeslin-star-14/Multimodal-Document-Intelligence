import type { DocumentItem, DocumentChunk, ChatMessage, ConflictRecord } from '../types';

// Render clean document page SVG matching the screenshot
export const mockVerityPageSvg = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
    <!-- Background Card -->
    <rect width="600" height="450" fill="#ffffff" rx="8" stroke="#e5e7eb" stroke-width="1"/>
    
    <!-- Paragraph skeleton lines -->
    <rect x="30" y="30" width="220" height="8" rx="4" fill="#cbd5e1"/>
    <rect x="30" y="48" width="480" height="6" rx="3" fill="#e2e8f0"/>
    <rect x="30" y="62" width="450" height="6" rx="3" fill="#e2e8f0"/>

    <!-- Chart area -->
    <!-- Grid line -->
    <line x1="60" y1="280" x2="520" y2="280" stroke="#e2e8f0" stroke-width="1.5"/>
    <line x1="60" y1="210" x2="520" y2="210" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4 4"/>
    <line x1="60" y1="140" x2="520" y2="140" stroke="#f1f5f9" stroke-width="1" stroke-dasharray="4 4"/>

    <!-- Bar Q1 -->
    <rect x="100" y="195" width="55" height="85" rx="3" fill="#94a3b8" opacity="0.65"/>
    <text x="120" y="302" fill="#64748b" font-size="12" font-family="sans-serif">Q1</text>

    <!-- Bar Q2 -->
    <rect x="190" y="170" width="55" height="110" rx="3" fill="#94a3b8" opacity="0.65"/>
    <text x="210" y="302" fill="#64748b" font-size="12" font-family="sans-serif">Q2</text>

    <!-- Bar Q3 (Active Highlighted) -->
    <rect x="280" y="105" width="55" height="175" rx="3" fill="#64748b" opacity="0.85"/>
    <text x="300" y="302" fill="#475569" font-size="12" font-weight="bold" font-family="sans-serif">Q3</text>

    <!-- Bar Q4 -->
    <rect x="370" y="150" width="55" height="130" rx="3" fill="#94a3b8" opacity="0.65"/>
    <text x="390" y="302" fill="#64748b" font-size="12" font-family="sans-serif">Q4</text>

    <!-- Bottom skeleton lines -->
    <rect x="30" y="335" width="460" height="6" rx="3" fill="#e2e8f0"/>
    <rect x="30" y="350" width="380" height="6" rx="3" fill="#e2e8f0"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Annual Report 2025',
    size: '4.2 MB',
    type: 'pdf',
    pageCount: 48,
    uploadedAt: '10:45 AM',
    status: 'Ready',
    progress: 100,
    insights: {
      summary: 'Annual fiscal statement showing Q3 peak revenue of ₹4.2M, operating margin expansion, and multi-region business unit performance.',
      keyEntities: [
        { category: 'Financial', value: '₹4.2M Q3 Sales' },
        { category: 'Financial', value: '₹14.3M Total FY25' },
        { category: 'Metric', value: '68.5% Margin' },
        { category: 'Date', value: 'FY 2025' }
      ],
      suggestedQuestions: [
        'What changed in operating costs?',
        'List every payment deadline',
        'Do these files disagree on revenue?'
      ]
    },
    pageImages: [
      mockVerityPageSvg()
    ]
  },
  {
    id: 'doc-2',
    name: 'Invoice scan (Tamil)',
    size: '1.2 MB',
    type: 'image',
    pageCount: 2,
    uploadedAt: '10:48 AM',
    status: 'Ready',
    progress: 100,
    insights: {
      summary: 'Procurement invoice in Tamil for industrial components with GST compliance and payment schedules.',
      keyEntities: [
        { category: 'Financial', value: '₹2,183,000' },
        { category: 'Org', value: 'Titan Systems' },
        { category: 'Date', value: '15-Nov-2026' }
      ],
      suggestedQuestions: [
        'What is the total payable amount on the invoice?',
        'When is the payment due date?'
      ]
    },
    pageImages: [
      mockVerityPageSvg()
    ]
  },
  {
    id: 'doc-3',
    name: 'Vendor contract',
    size: '620 KB',
    type: 'docx',
    pageCount: 6,
    uploadedAt: '10:50 AM',
    status: 'Parsing',
    progress: 65,
    currentStepDescription: 'Reading tables...',
    pageImages: [
      mockVerityPageSvg()
    ]
  }
];

export const mockChunks: DocumentChunk[] = [
  {
    id: 'chunk-chart-q3',
    documentId: 'doc-1',
    documentName: 'Annual Report 2025',
    pageNumber: 5,
    type: 'chart',
    content: 'Quarterly Sales Breakdown: Q1: ₹2.8M, Q2: ₹3.1M, Q3: ₹4.2M (Peak Quarter), Q4: ₹3.6M. Chart confirms peak sales recorded in Q3.',
    similarityScore: 0.89,
    boundingBox: {
      id: 'bbox-chart-q3',
      x: 43.5,
      y: 19.5,
      width: 13.5,
      height: 49.0,
      label: 'Answer',
      type: 'chart',
      color: '#f59e0b'
    }
  },
  {
    id: 'chunk-table-summary',
    documentId: 'doc-1',
    documentName: 'Annual Report 2025',
    pageNumber: 6,
    type: 'table',
    content: 'Fiscal Summary Table: Q3 Performance ₹4.2M, YoY Growth +24%.',
    rawTableData: {
      headers: ['Quarter', 'Revenue (₹)', 'Growth YoY'],
      rows: [
        ['Q1', '₹2.8M', '+12%'],
        ['Q2', '₹3.1M', '+16%'],
        ['Q3', '₹4.2M', '+24%'],
        ['Q4', '₹3.6M', '+18%']
      ]
    },
    similarityScore: 0.84,
    boundingBox: {
      id: 'bbox-table-summary',
      x: 10,
      y: 20,
      width: 80,
      height: 40,
      label: 'Summary Table',
      type: 'table',
      color: '#0d5c4d'
    }
  }
];

export const mockConflicts: ConflictRecord[] = [
  {
    id: 'conf-1',
    topic: 'Revenue variance between preliminary note and audited report',
    claimA: {
      documentName: 'Annual Report 2025',
      pageNumber: 5,
      statement: 'Audited annual report confirms Q3 revenue reached ₹4.2M.',
      citationId: 'chunk-chart-q3'
    },
    claimB: {
      documentName: 'Vendor contract',
      pageNumber: 1,
      statement: 'Draft schedule estimated baseline Q3 deliverable at ₹3.8M.',
      citationId: 'doc-3'
    },
    variance: '₹400,000 variance between preliminary draft and final audit filing.',
    severity: 'medium'
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    timestamp: '10:51 AM',
    text: 'Which quarter had the highest sales?'
  },
  {
    id: 'msg-2',
    sender: 'assistant',
    timestamp: '10:51 AM',
    text: '**Q3 had the highest sales at ₹4.2M**, up from ₹3.1M in Q2. The chart on page 5 shows the same peak, and the summary table on page 6 confirms the figure.',
    confidenceScore: 94,
    citations: [
      {
        id: 'cite-page5-chart',
        documentId: 'doc-1',
        documentName: 'Annual Report 2025',
        pageNumber: 5,
        chunkType: 'chart',
        label: 'Page 5 · Chart',
        chunkId: 'chunk-chart-q3',
        similarityScore: 0.89,
        boundingBox: {
          id: 'bbox-chart-q3',
          x: 43.5,
          y: 19.5,
          width: 13.5,
          height: 49.0,
          label: 'Answer',
          type: 'chart',
          color: '#f59e0b'
        }
      },
      {
        id: 'cite-page6-table',
        documentId: 'doc-1',
        documentName: 'Annual Report 2025',
        pageNumber: 6,
        chunkType: 'table',
        label: 'Page 6 · Table 2',
        chunkId: 'chunk-table-summary',
        similarityScore: 0.84,
        boundingBox: {
          id: 'bbox-table-summary',
          x: 10,
          y: 20,
          width: 80,
          height: 40,
          label: 'Summary Table',
          type: 'table',
          color: '#0d5c4d'
        }
      }
    ]
  },
  {
    id: 'msg-3',
    sender: 'user',
    timestamp: '10:52 AM',
    text: 'What was the vendor penalty for late delivery?'
  },
  {
    id: 'msg-4',
    sender: 'assistant',
    timestamp: '10:52 AM',
    text: "I couldn't find a late-delivery penalty in the vendor contract. It is still being read, so try again in a moment.",
    notFound: true
  }
];
