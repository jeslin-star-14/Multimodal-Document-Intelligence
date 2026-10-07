import React, { useState } from 'react';
import { Header } from './components/Header';
import { DocumentPanel } from './components/DocumentPanel/DocumentPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { EvidencePanel } from './components/EvidencePanel/EvidencePanel';
import { ConflictModal } from './components/ConflictModal/ConflictModal';
import type { 
  DocumentItem, 
  ChatMessage, 
  Citation, 
  BoundingBox, 
  DocumentChunk, 
  LanguageCode, 
  ConflictRecord 
} from './types';
import { 
  initialDocuments, 
  initialChatMessages, 
  mockChunks, 
  mockConflicts, 
  mockPageSvgPreview 
} from './data/mockData';

export const App: React.FC = () => {
  // Application State
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-1');
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState<boolean>(false);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Evidence Panel State
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(5);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(
    initialChatMessages[1]?.citations?.[0] || null
  );
  const [activeBoxId, setActiveBoxId] = useState<string>('bbox-chart-1');
  const [activeChunkId, setActiveChunkId] = useState<string>('chunk-chart-q3');
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
  const [activeConflicts, setActiveConflicts] = useState<ConflictRecord[]>(mockConflicts);

  // Current active document
  const activeDocument = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Active page bounding boxes
  const currentBoundingBoxes: BoundingBox[] = mockChunks
    .filter(
      (c) =>
        c.documentId === activeDocument.id &&
        c.pageNumber === currentPageNumber &&
        c.boundingBox
    )
    .map((c) => c.boundingBox!);

  // Toggle Dark/Light Theme
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  // Handle Document Selection
  const handleSelectDocument = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setCurrentPageNumber(1);
      // Auto pick first chunk of this document if available
      const firstChunk = mockChunks.find((c) => c.documentId === docId);
      if (firstChunk) {
        setActiveChunkId(firstChunk.id);
        if (firstChunk.boundingBox) {
          setActiveBoxId(firstChunk.boundingBox.id);
        }
      }
    }
  };

  // Handle Citation Click -> Synchronizes Evidence Panel & Page
  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation);
    setSelectedDocId(citation.documentId);
    setCurrentPageNumber(citation.pageNumber);
    setActiveChunkId(citation.chunkId);
    if (citation.boundingBox) {
      setActiveBoxId(citation.boundingBox.id);
    }
  };

  // Handle Selecting a Chunk in Evidence Panel
  const handleSelectChunk = (chunk: DocumentChunk) => {
    setActiveChunkId(chunk.id);
    setSelectedDocId(chunk.documentId);
    setCurrentPageNumber(chunk.pageNumber);
    if (chunk.boundingBox) {
      setActiveBoxId(chunk.boundingBox.id);
    }
  };

  // Handle File Upload Simulation with Multi-step Progress
  const handleFileUpload = (files: FileList | File[]) => {
    Array.from(files).forEach((file, index) => {
      const fileId = `doc-${Date.now()}-${index}`;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = (['pdf', 'docx', 'pptx'].includes(ext) ? ext : 'image') as any;

      const newDoc: DocumentItem = {
        id: fileId,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: fileType,
        pageCount: fileType === 'image' ? 1 : 5,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Parsing',
        progress: 20,
        currentStepDescription: 'Extracting text & visual tokens',
        pageImages: [
          mockPageSvgPreview(1, file.name, 'Uploaded Document Stream', 'table'),
          mockPageSvgPreview(2, file.name, 'Visual Flow Analysis', 'chart')
        ]
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocId(fileId);

      // Simulate Step 2: OCR
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === fileId
              ? { ...d, status: 'OCR', progress: 55, currentStepDescription: 'Running Multi-modal OCR & Table Extraction' }
              : d
          )
        );
      }, 1200);

      // Simulate Step 3: Embedding
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === fileId
              ? { ...d, status: 'Embedding', progress: 85, currentStepDescription: 'Vectorizing multimodal chunks' }
              : d
          )
        );
      }, 2400);

      // Simulate Step 4: Ready with auto-insights
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === fileId
              ? {
                  ...d,
                  status: 'Ready',
                  progress: 100,
                  currentStepDescription: 'Processing complete',
                  insights: {
                    summary: `Automated executive breakdown of ${file.name} showing tabular financial items and visual figures.`,
                    keyEntities: [
                      { category: 'Org', value: 'Enterprise Division' },
                      { category: 'Metric', value: '99.4% Parsing Accuracy' },
                      { category: 'Date', value: 'Oct 2026' }
                    ],
                    suggestedQuestions: [
                      `What key figures are listed in ${file.name}?`,
                      `Extract any tables and summaries from ${file.name}`
                    ]
                  }
                }
              : d
          )
        );
      }, 3600);
    });
  };

  // Handle Query Submission and AI Response Simulation
  const handleSendMessage = (queryText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoadingAnswer(true);

    // Realistic intelligent matching based on query keywords
    setTimeout(() => {
      const lower = queryText.toLowerCase();
      let responseText = '';
      let citations: Citation[] = [];
      let confidence = 92;
      let conflicts: ConflictRecord[] | undefined = undefined;
      let notFound = false;

      if (lower.includes('invoice') || lower.includes('h100') || lower.includes('payable') || lower.includes('due')) {
        responseText = `The invoice **#INV-2026-094** was billed to **Titan Industrial Systems Ltd.** for a **GPU Computing Cluster (4x H100)**.\n\n- Subtotal: ₹1,850,000\n- GST @ 18%: ₹333,000\n- **Total Amount Payable: ₹2,183,000**\n- Payment Due Date: **15-Nov-2026**`;
        confidence = 96;
        const cite: Citation = {
          id: 'cite-inv-1',
          documentId: 'doc-2',
          documentName: 'Invoice_INV_2026_094.png',
          pageNumber: 1,
          chunkType: 'image',
          label: 'Page 1 · Invoice Breakdown',
          chunkId: 'chunk-invoice-total',
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
        };
        citations = [cite];
        handleCitationClick(cite);
      } else if (lower.includes('gross margin') || lower.includes('product') || lower.includes('enterprise ai')) {
        responseText = `According to the product performance table on Page 3:\n\n- **Enterprise AI Core**: **68.5% Gross Margin** (₹2.60M revenue, 1,420 units sold)\n- **Vision Analytics**: **54.2% Gross Margin** (₹1.15M revenue)\n- **Edge Gateway Pro**: **41.0% Gross Margin** (₹0.45M revenue)\n\nEnterprise AI Core achieved the highest operating efficiency.`;
        confidence = 91;
        const cite: Citation = {
          id: 'cite-prod-1',
          documentId: 'doc-1',
          documentName: 'FY25_Annual_Revenue_Report.pdf',
          pageNumber: 3,
          chunkType: 'table',
          label: 'Page 3 · Table 1',
          chunkId: 'chunk-table-products',
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
        };
        citations = [cite];
        handleCitationClick(cite);
      } else if (lower.includes('unrelated') || lower.includes('weather') || lower.includes('quantum')) {
        notFound = true;
        responseText = 'No grounding evidence found in the uploaded documents to answer this inquiry accurately.';
        confidence = 25;
      } else {
        responseText = `Based on the multimodal analysis of **FY25_Annual_Revenue_Report.pdf**, **Q3** recorded peak performance at **₹4.2M**, driven by 24% YoY margin expansion.\n\nVisual chart inspection on Page 5 and auditor sign-off confirm this distribution.`;
        confidence = 94;
        citations = [
          {
            id: 'cite-q3-1',
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
          }
        ];
        conflicts = mockConflicts;
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: responseText,
        confidenceScore: confidence,
        citations: citations,
        conflicts: conflicts,
        notFound: notFound
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoadingAnswer(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 light:bg-slate-50 light:text-slate-900">
      {/* Global Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenUpload={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = (e: any) => {
            if (e.target.files) handleFileUpload(e.target.files);
          };
          input.click();
        }}
        conflicts={activeConflicts}
        onOpenConflicts={() => setIsConflictModalOpen(true)}
      />

      {/* 3-Panel Main Layout (Left: Documents | Middle: Chat | Right: Evidence) */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Document Panel (Col span 3) */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-hidden">
          <DocumentPanel
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocument={handleSelectDocument}
            onFileUpload={handleFileUpload}
            onSelectQuestion={handleSendMessage}
            language={language}
          />
        </div>

        {/* Middle: Chat Panel (Col span 5) */}
        <div className="col-span-1 lg:col-span-5 h-full overflow-hidden border-r border-slate-800/80 light:border-slate-200">
          <ChatPanel
            messages={messages}
            isLoading={isLoadingAnswer}
            selectedCitation={selectedCitation}
            onCitationClick={handleCitationClick}
            onSendMessage={handleSendMessage}
            onOpenConflicts={(conflicts) => {
              setActiveConflicts(conflicts);
              setIsConflictModalOpen(true);
            }}
            language={language}
            selectedDocName={activeDocument?.name}
          />
        </div>

        {/* Right: Evidence Panel (Col span 4) - Unique Feature */}
        <div className="hidden md:block col-span-1 lg:col-span-4 h-full overflow-hidden">
          <EvidencePanel
            activeDocument={activeDocument}
            currentPageNumber={currentPageNumber}
            onPageChange={setCurrentPageNumber}
            boundingBoxes={currentBoundingBoxes}
            activeBoxId={activeBoxId}
            onBoxClick={(box) => setActiveBoxId(box.id)}
            chunks={mockChunks.filter((c) => c.documentId === activeDocument?.id)}
            activeChunkId={activeChunkId}
            onSelectChunk={handleSelectChunk}
            language={language}
          />
        </div>
      </main>

      {/* Cross-Document Conflict Modal */}
      <ConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={activeConflicts}
        language={language}
      />
    </div>
  );
};

export default App;
