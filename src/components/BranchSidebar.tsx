'use client';

import React, { useState } from 'react';
import { branches, regions } from '@/data/mockData';

interface BranchSidebarProps {
  selectedBranch: string;
  onSelectBranch: (code: string) => void;
}

export default function BranchSidebar({ selectedBranch, onSelectBranch }: BranchSidebarProps) {
  const [search, setSearch] = useState('');
  const [collapsedRegions, setCollapsedRegions] = useState<Set<string>>(new Set());

  const filteredBranches = branches.filter(
    b => b.name.toLowerCase().includes(search.toLowerCase()) || b.code.includes(search)
  );

  const toggleRegion = (region: string) => {
    setCollapsedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  return (
    <aside className="w-52 bg-slate-800 text-white flex flex-col h-screen shrink-0">
      {/* Logo / Title */}
      <div className="px-4 py-4 border-b border-slate-700">
        <h2 className="text-base font-bold tracking-tight">핸디즈 BQ 스케줄</h2>
        <p className="text-xs text-slate-400 mt-0.5">지점 스케줄 관리</p>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <input
          type="text"
          placeholder="지점 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Branch list */}
      <nav className="flex-1 overflow-y-auto px-1 pb-4">
        {regions.map(region => {
          const regionBranches = filteredBranches.filter(b => b.region === region);
          if (regionBranches.length === 0) return null;
          const isCollapsed = collapsedRegions.has(region);

          return (
            <div key={region} className="mb-1">
              <button
                onClick={() => toggleRegion(region)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200"
              >
                <span>{region}</span>
                <span className="text-[10px]">{isCollapsed ? '▸' : '▾'} {regionBranches.length}</span>
              </button>
              {!isCollapsed && (
                <div className="mt-0.5">
                  {regionBranches.map(branch => (
                    <button
                      key={branch.code}
                      onClick={() => onSelectBranch(branch.code)}
                      className={`sidebar-branch w-full text-left px-3 py-1.5 text-sm rounded-r flex items-center gap-2 ${
                        selectedBranch === branch.code
                          ? 'active bg-slate-700/50 text-white border-l-[3px] border-blue-400'
                          : 'text-slate-300 border-l-[3px] border-transparent'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 w-5 text-right">{branch.code}</span>
                      <span className="truncate">{branch.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
        총 {branches.length}개 지점
      </div>
    </aside>
  );
}
