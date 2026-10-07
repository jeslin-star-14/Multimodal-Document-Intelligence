import React from 'react';
import type { RoleMode } from '../types';
import { ShieldCheck, UserCheck, Briefcase, GraduationCap, Scale, Cpu } from 'lucide-react';

interface HeaderProps {
  roleMode?: RoleMode;
  onRoleModeChange?: (role: RoleMode) => void;
  onOpenConflicts?: () => void;
  conflictCount?: number;
}

const ROLES: { id: RoleMode; label: string; icon: any; desc: string }[] = [
  { id: 'Executive', label: 'Executive', icon: Briefcase, desc: 'High-level summaries & ROI' },
  { id: 'Auditor', label: 'Auditor', icon: ShieldCheck, desc: 'Precise cell-by-cell audit verification' },
  { id: 'Data Scientist', label: 'Data Scientist', icon: Cpu, desc: 'Formulas & statistical derivations' },
  { id: 'Student', label: 'Student', icon: GraduationCap, desc: 'Intuitive plain-language learning' },
  { id: 'Legal Counsel', label: 'Legal Counsel', icon: Scale, desc: 'Contractual liability & compliance clauses' },
];

export const Header: React.FC<HeaderProps> = ({
  roleMode = 'Executive',
  onRoleModeChange,
  onOpenConflicts,
  conflictCount = 0
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-7 h-7 rounded-lg bg-[#0d5c4d] flex items-center justify-center text-white shadow-xs">
          <div className="w-3.5 h-3.5 border-2 border-amber-300 rounded-[2px]" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-sans tracking-tight text-slate-900 font-bold leading-none">
            DOC-Q <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">Verity 2.5</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium leading-tight">Multimodal Document Intelligence</span>
        </div>
      </div>

      {/* Center / Right controls: Role Selector & System Capabilities */}
      <div className="flex items-center space-x-3">
        {/* Role Mode Selector */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-lg border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#0d5c4d]" />
            Persona:
          </span>
          <div className="flex items-center space-x-1">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = roleMode === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => onRoleModeChange?.(r.id)}
                  title={`${r.label}: ${r.desc}`}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#0d5c4d] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conflicts Modal Quick Action */}
        {onOpenConflicts && (
          <button
            onClick={onOpenConflicts}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-lg text-xs font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline">Audit Discrepancies</span>
            {conflictCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                {conflictCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
