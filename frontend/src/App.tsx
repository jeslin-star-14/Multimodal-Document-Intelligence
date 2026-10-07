import React, { useState, useEffect, useRef } from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
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
  ConflictRecord,
  ChatAttachment
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

  // Staged In-Chat File Attachments
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);

  // Resizable Panels State
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(260);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(420);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);

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

  // Handle Dragging Left / Right dividers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeftRef.current) {
        const newWidth = Math.max(180, Math.min(460, e.clientX));
        setLeftPanelWidth(newWidth);
      }
      if (isDraggingRightRef.current) {
        const newWidth = Math.max(280, Math.min(650, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeftRef.current = false;
      isDraggingRightRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleStartDragLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleStartDragRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRightRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

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

  // Handle "Upload / Insert Document into Chat"
  const handleAttachDocumentToChat = (doc: DocumentItem) => {
    const newAtt: ChatAttachment = {
      id: `att-${Date.now()}-${doc.id}`,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      isImage: doc.type === 'image'
    };

    setStagedAttachments((prev) => {
      if (prev.some((a) => a.name === doc.name)) return prev;
      return [...prev, newAtt];
    });
    setSelectedDocId(doc.id);
  };

  const handleRemoveAttachment = (attId: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== attId));
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
    // Auto-open right panel if closed
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true);
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

  // Handle File Upload
  const handleFileUpload = (files: FileList | File[]) => {
    const fileList = Array.from(files);

    // 1. Stage attachments directly in the chat box so the user sees them immediately
    const newAttachments: ChatAttachment[] = fileList.map((file, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      name: file.name,
      type: file.name.split('.').pop() || 'file',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isImage: file.type.startsWith('image/')
    }));
    setStagedAttachments((prev) => [...prev, ...newAttachments]);

    // 2. Add to Workspace Documents List
    fileList.forEach((file, index) => {
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
  const handleSendMessage = (queryText: string, attachments?: ChatAttachment[]) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: queryText,
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    setMessages((prev) => [...prev, userMsg]);
    setStagedAttachments([]); // clear staged attachments after sending
    setIsLoadingAnswer(true);

    setTimeout(() => {
      const lower = queryText.toLowerCase();
      let responseText = '';
      let citations: Citation[] = [];
      let confidence = 94;
      let notFound = false;

      if (attachments && attachments.length > 0) {
        const attNames = attachments.map(a => a.name).join(', ');
        responseText = `Analyzed **${attNames}**: Visual OCR and table extraction complete. All figures have been indexed for multimodal visual grounding.`;
      } else if (lower.includes('penalty') || lower.includes('late delivery') || lower.includes('unrelated')) {
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
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        isLeftPanelOpen={isLeftPanelOpen}
        onToggleLeftPanel={() => setIsLeftPanelOpen((prev) => !prev)}
        isRightPanelOpen={isRightPanelOpen}
        onToggleRightPanel={() => setIsRightPanelOpen((prev) => !prev)}
      />

      {/* Main 3-Panel Workspace */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left: Document Panel (Collapsible & Draggable Resizable) */}
        {isLeftPanelOpen && (
          <div
            style={{ width: `${leftPanelWidth}px` }}
            className="shrink-0 h-full overflow-hidden border-r border-slate-200/80 transition-[width] duration-75"
          >
            <DocumentPanel
              documents={documents}
              selectedDocId={selectedDocId}
              onSelectDocument={handleSelectDocument}
              onFileUpload={handleFileUpload}
              onSelectQuestion={(q) => handleSendMessage(q)}
              onAttachToChat={handleAttachDocumentToChat}
              onClosePanel={() => setIsLeftPanelOpen(false)}
              language={language}
            />
          </div>
        )}

        {/* Left Drag Resize Splitter Handle */}
        {isLeftPanelOpen && (
          <div
            onMouseDown={handleStartDragLeft}
            className="w-1 hover:w-1.5 bg-transparent hover:bg-[#0d5c4d]/40 transition-colors cursor-col-resize shrink-0 z-20 select-none relative group"
            title="Drag to resize Documents Panel"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
          </div>
        )}

        {/* Middle: Chat Panel (Fluid width) */}
        <div className="flex-1 h-full overflow-hidden relative flex flex-col bg-white">
          {/* Quick Floating Restore Buttons when panels are closed */}
          {!isLeftPanelOpen && (
            <button
              onClick={() => setIsLeftPanelOpen(true)}
              className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
              title="Show Documents Panel"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-[#0d5c4d]" />
              <span>Documents</span>
            </button>
          )}

          {!isRightPanelOpen && (
            <button
              onClick={() => setIsRightPanelOpen(true)}
              className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
              title="Show Evidence Panel"
            >
              <span>Evidence</span>
              <PanelRightOpen className="w-3.5 h-3.5 text-[#0d5c4d]" />
            </button>
          )}

          <ChatPanel
            messages={messages}
            isLoading={isLoadingAnswer}
            selectedCitation={selectedCitation}
            onCitationClick={handleCitationClick}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            stagedAttachments={stagedAttachments}
            onRemoveAttachment={handleRemoveAttachment}
            onOpenConflicts={(conflicts) => {
              setActiveConflicts(conflicts);
              setIsConflictModalOpen(true);
            }}
            language={language}
            selectedDocName={activeDocument?.name}
          />
        </div>

        {/* Right Drag Resize Splitter Handle */}
        {isRightPanelOpen && (
          <div
            onMouseDown={handleStartDragRight}
            className="w-1 hover:w-1.5 bg-transparent hover:bg-[#0d5c4d]/40 transition-colors cursor-col-resize shrink-0 z-20 select-none relative group"
            title="Drag to resize Evidence Panel"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
          </div>
        )}

        {/* Right: Evidence Panel (Collapsible & Draggable Resizable) */}
        {isRightPanelOpen && (
          <div
            style={{ width: `${rightPanelWidth}px` }}
            className="shrink-0 h-full overflow-hidden border-l border-slate-200/80 transition-[width] duration-75"
          >
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
              onClosePanel={() => setIsRightPanelOpen(false)}
              language={language}
            />
          </div>
        )}
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
