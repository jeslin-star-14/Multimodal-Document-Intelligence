import React, { useState, useEffect, useRef } from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { Header } from './components/Header';
import { DocumentPanel } from './components/DocumentPanel/DocumentPanel';
import { ChatPanel } from './components/ChatPanel/ChatPanel';
import { EvidencePanel } from './components/EvidencePanel/EvidencePanel';
import { ConflictModal } from './components/ConflictModal/ConflictModal';
import { DocumentGapsModal } from './components/DocumentPanel/DocumentGapsModal';
import type { 
  DocumentItem, 
  ChatMessage, 
  Citation, 
  BoundingBox, 
  DocumentChunk, 
  LanguageCode, 
  ChatAttachment,
  ChatSession,
  RoleMode
} from './types';

export const App: React.FC = () => {
  // Application State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState<boolean>(false);
  const [roleMode, setRoleMode] = useState<RoleMode>('Executive');
  const language: LanguageCode = 'en';

  // Conflict & Gaps Modal State
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [activeConflicts, setActiveConflicts] = useState<any[]>([]);
  const [isGapsModalOpen, setIsGapsModalOpen] = useState(false);
  const [gapsDocId, setGapsDocId] = useState<string | null>(null);

  // Load existing indexed documents & conflicts from backend on mount
  useEffect(() => {
    const fetchExistingDocuments = async () => {
      try {
        const res = await fetch('/api/documents');
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            const mapped: DocumentItem[] = data.documents.map((d: any) => ({
              id: d.id,
              name: d.name,
              size: d.size || '1.8 MB',
              type: d.type || 'pdf',
              pageCount: d.page_count || 1,
              uploadedAt: d.uploaded_at || 'Today',
              status: 'Ready',
              progress: 100,
              currentStepDescription: 'Ready',
              pageImages: d.page_images || [`/data/pages/${d.id}/page_1.png`],
              insights: {
                summary: `Document "${d.name}" indexed with ${d.evidence_count || 2} multimodal chunks.`,
                keyEntities: [
                  { category: 'Doc', value: d.name.replace(/\.[^/.]+$/, '') },
                  { category: 'Metric', value: '100% Grounded' }
                ],
                suggestedQuestions: [
                  `What was the production efficiency in Q4?`,
                  `Compare Q2 vs Q4 factory performance`
                ]
              }
            }));
            setDocuments(mapped);
            setSelectedDocId(mapped[0].id);
          }
        }
      } catch (e) {
        console.log('Backend documents load skipped:', e);
      }
    };

    const fetchConflicts = async () => {
      try {
        const res = await fetch('/api/documents/conflicts');
        if (res.ok) {
          const data = await res.json();
          if (data.conflicts) {
            setActiveConflicts(data.conflicts);
          }
        }
      } catch (e) {
        console.log('Backend conflicts load skipped:', e);
      }
    };

    fetchExistingDocuments();
    fetchConflicts();
  }, []);

  // Automatically load chunks for selected document
  useEffect(() => {
    if (!selectedDocId) return;
    const fetchDocChunks = async () => {
      try {
        const res = await fetch(`/api/documents/${selectedDocId}/chunks`);
        if (res.ok) {
          const data = await res.json();
          if (data.chunks && data.chunks.length > 0) {
            setChunks((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const fresh = data.chunks.filter((c: any) => !existingIds.has(c.id));
              return [...prev, ...fresh];
            });
            const firstChunkWithBox = data.chunks.find((c: any) => c.boundingBox);
            if (firstChunkWithBox) {
              setActiveChunkId(firstChunkWithBox.id);
              setActiveBoxId(firstChunkWithBox.boundingBox.id);
            }
          }
        }
      } catch (e) {
        // ignore error
      }
    };
    fetchDocChunks();
  }, [selectedDocId]);

  // Chat Sessions History State (Persisted in localStorage)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('docq_chat_sessions') || localStorage.getItem('verity_chat_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Sync chatSessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('docq_chat_sessions', JSON.stringify(chatSessions));
    } catch {
      // ignore storage errors
    }
  }, [chatSessions]);

  // Handle Starting a New Chat Conversation
  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: []
    };
    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setMessages([]);
    setStagedAttachments([]);
  };

  // Handle Selecting a Past Chat Session
  const handleSelectSession = (sessionId: string) => {
    const targetSession = chatSessions.find((s) => s.id === sessionId);
    if (targetSession) {
      setActiveSessionId(sessionId);
      setMessages(targetSession.messages);
      setStagedAttachments([]);
    }
  };

  // Handle Deleting a Chat Session
  const handleDeleteSession = (sessionId: string) => {
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  // Staged attachments waiting to be sent with next message
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);

  // Navigation & Evidence State
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);

  // Layout & Resizing States
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(270);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(440);

  // Resize Drag Handlers
  const isDraggingLeft = useRef<boolean>(false);
  const isDraggingRight = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        const newWidth = Math.max(220, Math.min(480, e.clientX));
        setLeftPanelWidth(newWidth);
      } else if (isDraggingRight.current) {
        const newWidth = Math.max(320, Math.min(680, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
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
    isDraggingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleStartDragRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Active Document Helper
  const activeDocument = documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  // Selected document bounding boxes
  const currentBoundingBoxes: BoundingBox[] = chunks
    .filter((c) => (!activeDocument || c.documentId === activeDocument.id || c.documentName === activeDocument.name) && c.pageNumber === currentPageNumber)
    .map((c) => c.boundingBox)
    .filter((b): b is BoundingBox => Boolean(b));

  // Handle Document Selection
  const handleSelectDocument = (id: string) => {
    setSelectedDocId(id);
    setCurrentPageNumber(1);
    setActiveBoxId(null);
    setActiveChunkId(null);
  };

  // Handle Deleting an Uploaded Document
  const handleDeleteDocument = async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    } catch {
      // ignore network errors
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setChunks((prev) => prev.filter((c) => c.documentId !== id));
    if (selectedDocId === id) {
      const remaining = documents.filter((d) => d.id !== id);
      setSelectedDocId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Handle Attaching a Workspace Document directly into Chat Box
  const handleAttachDocumentToChat = (doc: DocumentItem) => {
    const newAtt: ChatAttachment = {
      id: `att-doc-${doc.id}-${Date.now()}`,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      isImage: doc.type === 'image'
    };
    if (!stagedAttachments.some((a) => a.name === doc.name)) {
      setStagedAttachments((prev) => [...prev, newAtt]);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Handle Citation Click in Chat Message
  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation);
    const matchingDoc = documents.find(
      (d) => d.id === citation.documentId || d.name === citation.documentName || citation.documentName.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matchingDoc) {
      setSelectedDocId(matchingDoc.id);
    }
    if (citation.pageNumber) {
      setCurrentPageNumber(citation.pageNumber);
    }
    if (citation.boundingBox) {
      setActiveBoxId(citation.boundingBox.id);
    }
    if (citation.chunkId) {
      setActiveChunkId(citation.chunkId);
    }
    setIsRightPanelOpen(true);
  };

  // Handle Chunk Click in Evidence Panel
  const handleSelectChunk = (chunk: DocumentChunk) => {
    setActiveChunkId(chunk.id);
    const matchingDoc = documents.find(d => d.id === chunk.documentId || d.name === chunk.documentName);
    if (matchingDoc) {
      setSelectedDocId(matchingDoc.id);
    }
    setCurrentPageNumber(chunk.pageNumber || 1);
    if (chunk.boundingBox) {
      setActiveBoxId(chunk.boundingBox.id);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);

    const newAttachments: ChatAttachment[] = fileList.map((file, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      name: file.name,
      type: file.name.split('.').pop() || 'file',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isImage: file.type.startsWith('image/')
    }));
    setStagedAttachments((prev) => [...prev, ...newAttachments]);

    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      const fileId = `doc-${Date.now()}-${index}`;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileType = (['pdf', 'docx', 'pptx'].includes(ext) ? ext : 'image') as any;

      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

      const newDoc: DocumentItem = {
        id: fileId,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: fileType,
        pageCount: 1,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Parsing',
        progress: 40,
        currentStepDescription: 'Analyzing document structure...',
        pageImages: previewUrl ? [previewUrl] : []
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocId(fileId);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const realDocId = data.document_id || data.id || fileId;
          const pageCount = data.page_count || 1;
          const realPageImages = Array.from({ length: pageCount }, (_, i) => 
            `/data/pages/${realDocId}/page_${i+1}.png`
          );
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === fileId
                ? {
                    ...d,
                    id: realDocId,
                    status: 'Ready',
                    progress: 100,
                    currentStepDescription: 'Ready',
                    pageCount: pageCount,
                    pageImages: realPageImages.length > 0 ? realPageImages : d.pageImages,
                    insights: {
                      summary: `Document "${file.name}" indexed for visual RAG with ${data.evidence_count || 0} chunks.`,
                      keyEntities: [
                        { category: 'Org', value: file.name.replace(/\.[^/.]+$/, '') },
                        { category: 'Metric', value: `${data.evidence_count || pageCount} Chunks Indexed` }
                      ],
                      suggestedQuestions: [
                        `Summarize the contents of ${file.name}`,
                        `Extract key tables and figures from ${file.name}`
                      ]
                    }
                  }
                : d
            )
          );
          setSelectedDocId(realDocId);
        } else {
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === fileId
                ? {
                    ...d,
                    status: 'Ready',
                    progress: 100,
                    currentStepDescription: 'Ready'
                  }
                : d
            )
          );
        }
      } catch {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === fileId
              ? {
                  ...d,
                  status: 'Ready',
                  progress: 100,
                  currentStepDescription: 'Ready'
                }
              : d
          )
        );
      }
    }
  };

  // Handle Query Submission with Role Mode
  const handleSendMessage = async (queryText: string, attachments?: ChatAttachment[]) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: queryText,
      attachments: attachments && attachments.length > 0 ? attachments : undefined
    };

    const updatedMessagesWithUser = [...messages, userMsg];
    setMessages(updatedMessagesWithUser);
    setStagedAttachments([]);
    setIsLoadingAnswer(true);

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      currentSessionId = `session-${Date.now()}`;
      setActiveSessionId(currentSessionId);
      const newSession: ChatSession = {
        id: currentSessionId,
        title: queryText.length > 32 ? queryText.slice(0, 32) + '...' : queryText,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: updatedMessagesWithUser
      };
      setChatSessions((prev) => [newSession, ...prev]);
    } else {
      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                messages: updatedMessagesWithUser
              }
            : s
        )
      );
    }

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          document_id: activeDocument?.name || null,
          role_mode: roleMode
        })
      });

      let aiMsg: ChatMessage;

      if (response.ok) {
        const data = await response.json();
        
        const citations: Citation[] = data.citations || [];
        if (citations.length > 0) {
          const newChunks: DocumentChunk[] = citations.map((c: Citation) => ({
            id: c.chunkId || `chunk-${c.id}`,
            documentId: c.documentId,
            documentName: c.documentName,
            pageNumber: c.pageNumber || 1,
            type: c.chunkType,
            content: c.label,
            similarityScore: c.similarityScore || 0.9,
            boundingBox: c.boundingBox
          }));

          setChunks((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const fresh = newChunks.filter((c) => !existingIds.has(c.id));
            return [...prev, ...fresh];
          });

          setSelectedCitation(citations[0]);
          const matchingDoc = documents.find(d => d.id === citations[0].documentId || d.name === citations[0].documentName);
          if (matchingDoc) {
            setSelectedDocId(matchingDoc.id);
          }
          if (citations[0].pageNumber) {
            setCurrentPageNumber(citations[0].pageNumber);
          }
          if (citations[0].boundingBox) {
            setActiveBoxId(citations[0].boundingBox.id);
          }
          setIsRightPanelOpen(true);
        }

        aiMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: data.text || "No response received.",
          confidenceScore: data.confidence_score,
          citations: citations,
          notFound: data.not_found,
          proof_level: data.proof_level,
          proof_explanation: data.proof_explanation,
          verified_calculations: data.verified_calculations,
          role_mode: data.role_mode || roleMode
        };
      } else {
        throw new Error(`API error: ${response.statusText}`);
      }

      const finalMessages = [...updatedMessagesWithUser, aiMsg];
      setMessages(finalMessages);

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: finalMessages }
            : s
        )
      );
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Unable to connect to the backend engine at \`/api/chat/query\`. Please make sure the backend FastAPI service is running on port 8000.`,
        notFound: true
      };
      const finalMessages = [...updatedMessagesWithUser, fallbackMsg];
      setMessages(finalMessages);

      setChatSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: finalMessages }
            : s
        )
      );
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      {/* Header with Role Mode & Conflicts Button */}
      <Header 
        roleMode={roleMode}
        onRoleModeChange={setRoleMode}
        onOpenConflicts={() => setIsConflictModalOpen(true)}
        conflictCount={activeConflicts.length}
      />

      {/* Main 3-Panel Workspace */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left: Document Panel */}
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
              onAttachToChat={handleAttachDocumentToChat}
              onDeleteDocument={handleDeleteDocument}
              onOpenGaps={(docId) => {
                setGapsDocId(docId);
                setIsGapsModalOpen(true);
              }}
              onClosePanel={() => setIsLeftPanelOpen(false)}
              language={language}
              chatSessions={chatSessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
              onDeleteSession={handleDeleteSession}
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

        {/* Right: Evidence Panel */}
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
              activeBoxId={activeBoxId || undefined}
              onBoxClick={(box) => setActiveBoxId(box.id)}
              chunks={chunks.filter((c) => !activeDocument || c.documentId === activeDocument.id || c.documentName === activeDocument.name)}
              activeChunkId={activeChunkId || undefined}
              onSelectChunk={handleSelectChunk}
              onClosePanel={() => setIsRightPanelOpen(false)}
              language={language}
              selectedCitation={selectedCitation}
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

      {/* Document Gaps Modal */}
      <DocumentGapsModal
        isOpen={isGapsModalOpen}
        onClose={() => setIsGapsModalOpen(false)}
        documentId={gapsDocId || selectedDocId}
        documentName={activeDocument?.name}
      />
    </div>
  );
};

export default App;
