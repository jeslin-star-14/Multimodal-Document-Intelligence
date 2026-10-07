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
  mockVerityPageSvg 
} from './data/mockData';

export const App: React.FC = () => {
  // Application State
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-1');
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState<boolean>(false);
  const [language, setLanguage] = useState<LanguageCode>('en');

  // Evidence Panel State
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(5);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(
    initialChatMessages[1]?.citations?.[0] || null
  );
  const [activeBoxId, setActiveBoxId] = useState<string>('bbox-chart-q3');
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

  // Handle Document Selection
  const handleSelectDocument = (docId: string) => {
    setSelectedDocId(docId);
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setCurrentPageNumber(5);
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
        pageCount: fileType === 'image' ? 1 : 12,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Parsing',
        progress: 30,
        currentStepDescription: 'Reading tables...',
        pageImages: [
          mockVerityPageSvg()
        ]
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocId(fileId);

      // Transition to Ready
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === fileId
              ? {
                  ...d,
                  status: 'Ready',
                  progress: 100,
                  currentStepDescription: 'Ready',
                  insights: {
                    summary: `Document ${file.name} processed and indexed with visual grounding.`,
                    keyEntities: [
                      { category: 'Org', value: 'Enterprise Systems' },
                      { category: 'Metric', value: '100% Parsed' }
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
      }, 2500);
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

    setTimeout(() => {
      const lower = queryText.toLowerCase();
      let responseText = '';
      let citations: Citation[] = [];
      let confidence = 94;
      let notFound = false;

      if (lower.includes('penalty') || lower.includes('late delivery') || lower.includes('unrelated')) {
        notFound = true;
        responseText = "I couldn't find a late-delivery penalty in the vendor contract. It is still being read, so try again in a moment.";
      } else if (lower.includes('operating cost') || lower.includes('cost')) {
        responseText = "**Operating costs decreased by 8.4% in Q3**, primarily due to automated inventory processing and vendor contract consolidations.";
        citations = [
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
          }
        ];
      } else {
        responseText = "**Q3 had the highest sales at ₹4.2M**, up from ₹3.1M in Q2. The chart on page 5 shows the same peak, and the summary table on page 6 confirms the figure.";
        citations = [
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
        ];
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: responseText,
        confidenceScore: confidence,
        citations: citations,
        notFound: notFound
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoadingAnswer(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      {/* Global Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onOpenUpload={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = (e: any) => {
            if (e.target.files) handleFileUpload(e.target.files);
          };
          input.click();
        }}
      />

      {/* 3-Panel Main Layout (Left: Documents | Middle: Chat | Right: Evidence) */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left: Document Panel (Col span 3) */}
        <div className="hidden md:block md:col-span-3 lg:col-span-2 h-full overflow-hidden">
          <DocumentPanel
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocument={handleSelectDocument}
            onFileUpload={handleFileUpload}
            onSelectQuestion={handleSendMessage}
            language={language}
          />
        </div>

        {/* Middle: Chat Panel (Col span 5 / 6) */}
        <div className="col-span-1 md:col-span-5 lg:col-span-6 h-full overflow-hidden border-r border-slate-200/80">
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

        {/* Right: Evidence Panel (Col span 4) */}
        <div className="hidden md:block md:col-span-4 lg:col-span-4 h-full overflow-hidden">
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
