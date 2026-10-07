import React from 'react';
import { MessageSquare, Trash2, Clock } from 'lucide-react';
import type { ChatSession, LanguageCode } from '../../types';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  language: LanguageCode;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}) => {
  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Header with Title and count badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Chat History</span>
        </div>
        {sessions.length > 0 && (
          <span className="text-[11px] font-normal px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
            {sessions.length}
          </span>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
        {sessions.length === 0 ? (
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50/50">
            <p className="text-xs font-medium text-slate-600">No past chats</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Conversations will appear here.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#eaf5f2] border-[#bce2d8] text-[#0d5c4d]'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#0d5c4d]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-medium truncate">
                      {session.title || 'Untitled Conversation'}
                    </h5>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {session.lastUpdated || session.createdAt} · {session.messages.length} msgs
                    </p>
                  </div>
                </div>

                {/* Delete Chat Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer ml-1 shrink-0"
                  title="Delete chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

