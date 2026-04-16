'use client';

import React, { useState, useEffect } from 'react';
import { AdminSettings, EditorPermission, getAdminSettings, saveAdminSettings, getMasterPassword, setMasterPassword } from '@/data/auth';
import { Employee, branches } from '@/data/mockData';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
}

export default function AdminPanel({ isOpen, onClose, employees }: AdminPanelProps) {
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [savedSettings, setSavedSettings] = useState<AdminSettings>(getAdminSettings());
  const [search, setSearch] = useState('');
  const [expandedEditor, setExpandedEditor] = useState<string | null>(null);
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const s = getAdminSettings();
      setSettings(s);
      setSavedSettings(s);
      setSaveMsg(false);
      setExpandedEditor(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const uniqueNames = Array.from(new Set(employees.filter(e => e.name.trim()).map(e => e.name))).sort();
  const filtered = search ? uniqueNames.filter(n => n.toLowerCase().includes(search.toLowerCase())) : uniqueNames;
  const perms = settings.editorPermissions || [];

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const getPermission = (name: string): EditorPermission | undefined => perms.find(p => p.name === name);
  const isEditor = (name: string) => perms.some(p => p.name === name);
  const isAllBranches = (name: string) => {
    const p = getPermission(name);
    return p?.branches.includes('*') || false;
  };

  const toggleEditor = (name: string) => {
    const newPerms = isEditor(name)
      ? perms.filter(p => p.name !== name)
      : [...perms, { name, branches: ['*'] }]; // 기본: 전체 지점
    setSettings(s => ({ ...s, editorPermissions: newPerms }));
    setSaveMsg(false);
    if (!isEditor(name)) setExpandedEditor(name); // 새로 추가하면 펼치기
  };

  const toggleAllBranches = (name: string) => {
    const newPerms = perms.map(p =>
      p.name === name ? { ...p, branches: p.branches.includes('*') ? [] : ['*'] } : p
    );
    setSettings(s => ({ ...s, editorPermissions: newPerms }));
    setSaveMsg(false);
  };

  const toggleBranch = (name: string, branchCode: string) => {
    const newPerms = perms.map(p => {
      if (p.name !== name) return p;
      // 전체 선택 상태에서 개별 지점 해제 → 전체 빼고 나머지 지점 넣기
      let newBranches = [...p.branches];
      if (newBranches.includes('*')) {
        newBranches = branches.map(b => b.code).filter(c => c !== branchCode);
      } else if (newBranches.includes(branchCode)) {
        newBranches = newBranches.filter(c => c !== branchCode);
      } else {
        newBranches.push(branchCode);
        // 전부 선택되면 * 로 변환
        if (newBranches.length === branches.length) newBranches = ['*'];
      }
      return { ...p, branches: newBranches };
    });
    setSettings(s => ({ ...s, editorPermissions: newPerms }));
    setSaveMsg(false);
  };

  const toggleEditPeriod = () => {
    setSettings(s => ({ ...s, editPeriodOverride: !s.editPeriodOverride }));
    setSaveMsg(false);
  };

  const handleSave = () => {
    saveAdminSettings(settings);
    setSavedSettings(settings);
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  };

  const getBranchLabel = (perm: EditorPermission) => {
    if (perm.branches.includes('*')) return '전체 지점';
    if (perm.branches.length === 0) return '지점 미지정';
    if (perm.branches.length <= 3) return perm.branches.map(c => {
      const b = branches.find(br => br.code === c);
      return b ? b.name : c;
    }).join(', ');
    return `${perm.branches.length}개 지점`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">권한 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-4 border-b space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.editPeriodOverride} onChange={toggleEditPeriod} className="w-4 h-4 rounded" />
            <div>
              <span className="font-medium text-sm">편집 기간 오버라이드</span>
              <p className="text-xs text-gray-500">20~24일 외에도 에디터 편집 허용</p>
            </div>
          </label>

          {/* 비밀번호 변경 */}
          <div className="pt-2">
            <button
              onClick={() => { setShowPwChange(!showPwChange); setPwMsg(null); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              🔑 마스터 비밀번호 {showPwChange ? '닫기' : '변경'}
            </button>
            {showPwChange && (
              <div className="mt-2 space-y-2 bg-gray-50 rounded-lg p-3">
                <input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwMsg(null); }} placeholder="현재 비밀번호" className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="password" value={newPw} onChange={e => { setNewPw(e.target.value); setPwMsg(null); }} placeholder="새 비밀번호 (4자 이상)" className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                <input type="password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwMsg(null); }} placeholder="새 비밀번호 확인" className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
                {pwMsg && <p className={`text-xs ${pwMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{pwMsg.text}</p>}
                <button
                  onClick={() => {
                    if (currentPw !== getMasterPassword()) { setPwMsg({ type: 'err', text: '현재 비밀번호가 틀렸습니다' }); return; }
                    if (newPw.length < 4) { setPwMsg({ type: 'err', text: '새 비밀번호는 4자 이상이어야 합니다' }); return; }
                    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다' }); return; }
                    setMasterPassword(newPw);
                    setPwMsg({ type: 'ok', text: '비밀번호가 변경되었습니다!' });
                    setCurrentPw(''); setNewPw(''); setConfirmPw('');
                  }}
                  className="w-full py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >변경하기</button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-b space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">에디터 권한 ({perms.length}명)</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름 검색..."
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {filtered.map(name => {
              const perm = getPermission(name);
              const isExpanded = expandedEditor === name;
              return (
                <div key={name} className={`rounded-lg transition ${isEditor(name) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2 py-2 px-2">
                    <input
                      type="checkbox"
                      checked={isEditor(name)}
                      onChange={() => toggleEditor(name)}
                      className="w-3.5 h-3.5 rounded shrink-0"
                    />
                    <span className="text-sm font-medium flex-1">{name}</span>
                    {perm && (
                      <>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          perm.branches.includes('*') ? 'bg-purple-100 text-purple-700' :
                          perm.branches.length > 0 ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-500'
                        }`}>
                          {getBranchLabel(perm)}
                        </span>
                        <button
                          onClick={() => setExpandedEditor(isExpanded ? null : name)}
                          className="text-[10px] text-gray-400 hover:text-blue-600 px-1"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* 지점 선택 펼치기 */}
                  {perm && isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllBranches(name)}
                            onChange={() => toggleAllBranches(name)}
                            className="w-3 h-3 rounded"
                          />
                          <span className="text-xs font-semibold text-purple-700">전체 지점</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {branches.map(b => {
                          const checked = perm.branches.includes('*') || perm.branches.includes(b.code);
                          return (
                            <label key={b.code} className="flex items-center gap-1 cursor-pointer py-0.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleBranch(name, b.code)}
                                className="w-2.5 h-2.5 rounded"
                              />
                              <span className={`text-[10px] ${checked ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                                {b.code}_{b.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-3">
          {saveMsg ? (
            <span className="text-sm text-green-600 font-medium">저장 완료!</span>
          ) : hasChanges ? (
            <span className="text-xs text-orange-500">변경사항이 있습니다</span>
          ) : (
            <span className="text-xs text-gray-400">변경사항 없음</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${
              hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
