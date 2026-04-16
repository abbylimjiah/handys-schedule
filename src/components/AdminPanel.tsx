'use client';

import React, { useState, useEffect } from 'react';
import { AdminSettings, EditorPermission, getAdminSettings, saveAdminSettings, getMasterPassword, setMasterPassword } from '@/data/auth';
import { Employee, branches } from '@/data/mockData';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
}

interface EditingUser {
  name: string;
  role: 'editor' | 'viewer';
  branches: string[];
}

export default function AdminPanel({ isOpen, onClose, employees }: AdminPanelProps) {
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [savedSettings, setSavedSettings] = useState<AdminSettings>(getAdminSettings());
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const s = getAdminSettings();
      setSettings(s);
      setSavedSettings(s);
      setSaveMsg(false);
      setEditingUser(null);
      setShowAddForm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const perms = settings.editorPermissions || [];
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const uniqueNames = Array.from(new Set(employees.filter(e => e.name.trim()).map(e => e.name))).sort();

  const editorList = perms.map(p => ({
    name: p.name,
    branchCodes: p.branches,
  }));

  const filteredEditors = search
    ? editorList.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : editorList;

  const filteredViewers = uniqueNames.filter(n =>
    !perms.some(p => p.name === n) &&
    (!search || n.toLowerCase().includes(search.toLowerCase()))
  );

  const getBranchLabel = (codes: string[]) => {
    if (codes.includes('*')) return '전체 지점';
    if (codes.length === 0) return '미지정';
    if (codes.length <= 2) return codes.map(c => branches.find(b => b.code === c)?.name || c).join(', ');
    return `${codes.length}개 지점`;
  };

  const removeEditor = (name: string) => {
    setSettings(s => ({ ...s, editorPermissions: s.editorPermissions.filter(p => p.name !== name) }));
    setSaveMsg(false);
  };

  const addEditor = (name: string) => {
    if (perms.some(p => p.name === name)) return;
    const emp = employees.find(e => e.name === name);
    const defaultBranch = emp ? [emp.code] : ['*'];
    setSettings(s => ({ ...s, editorPermissions: [...s.editorPermissions, { name, branches: defaultBranch }] }));
    setSaveMsg(false);
  };

  const openEditModal = (name: string) => {
    const perm = perms.find(p => p.name === name);
    const emp = employees.find(e => e.name === name);
    setEditingUser({
      name,
      role: perm ? 'editor' : 'viewer',
      branches: perm?.branches || (emp ? [emp.code] : []),
    });
  };

  const saveEditModal = () => {
    if (!editingUser) return;
    if (editingUser.role === 'editor') {
      const exists = perms.find(p => p.name === editingUser.name);
      if (exists) {
        setSettings(s => ({
          ...s,
          editorPermissions: s.editorPermissions.map(p =>
            p.name === editingUser.name ? { ...p, branches: editingUser.branches } : p
          ),
        }));
      } else {
        setSettings(s => ({
          ...s,
          editorPermissions: [...s.editorPermissions, { name: editingUser.name, branches: editingUser.branches }],
        }));
      }
    } else {
      setSettings(s => ({ ...s, editorPermissions: s.editorPermissions.filter(p => p.name !== editingUser.name) }));
    }
    setEditingUser(null);
    setSaveMsg(false);
  };

  const toggleBranchInModal = (code: string) => {
    if (!editingUser) return;
    let b = [...editingUser.branches];
    if (b.includes('*')) {
      b = branches.map(br => br.code).filter(c => c !== code);
    } else if (b.includes(code)) {
      b = b.filter(c => c !== code);
    } else {
      b.push(code);
      if (b.length === branches.length) b = ['*'];
    }
    setEditingUser({ ...editingUser, branches: b });
  };

  const handleSave = () => {
    saveAdminSettings(settings);
    setSavedSettings(settings);
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  };

  const toggleEditPeriod = () => {
    setSettings(s => ({ ...s, editPeriodOverride: !s.editPeriodOverride }));
    setSaveMsg(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">권한 관리</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">총 {perms.length}명 에디터</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
        </div>

        {/* 설정 */}
        <div className="p-3 border-b bg-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.editPeriodOverride} onChange={toggleEditPeriod} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium">편집 기간 오버라이드</span>
              <span className="text-xs text-gray-400">(20~24일 외 허용)</span>
            </label>
            <button onClick={() => { setShowPwChange(!showPwChange); setPwMsg(null); }} className="text-xs text-blue-600 hover:underline">🔑 비밀번호 변경</button>
          </div>
          {showPwChange && (
            <div className="flex gap-2 items-end flex-wrap">
              <input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwMsg(null); }} placeholder="현재 비번" className="px-2 py-1 text-xs border rounded w-24" />
              <input type="password" value={newPw} onChange={e => { setNewPw(e.target.value); setPwMsg(null); }} placeholder="새 비번" className="px-2 py-1 text-xs border rounded w-24" />
              <input type="password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwMsg(null); }} placeholder="확인" className="px-2 py-1 text-xs border rounded w-24" />
              <button onClick={() => {
                if (currentPw !== getMasterPassword()) { setPwMsg({ type: 'err', text: '현재 비번 오류' }); return; }
                if (newPw.length < 4) { setPwMsg({ type: 'err', text: '4자 이상' }); return; }
                if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: '불일치' }); return; }
                setMasterPassword(newPw); setPwMsg({ type: 'ok', text: '변경완료!' }); setCurrentPw(''); setNewPw(''); setConfirmPw('');
              }} className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">변경</button>
              {pwMsg && <span className={`text-xs ${pwMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{pwMsg.text}</span>}
            </div>
          )}
        </div>

        {/* 검색 + 에디터 추가 */}
        <div className="p-3 border-b flex items-center gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 검색..."
            className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400" />
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
            + 에디터 추가
          </button>
        </div>

        {showAddForm && (
          <div className="p-3 border-b bg-blue-50 space-y-2">
            {/* 직접 입력 */}
            <div>
              <div className="text-[10px] text-blue-600 mb-1 font-medium">직접 입력 (직원 목록에 없는 사람도 추가 가능)</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customName.trim()) {
                      addEditor(customName.trim());
                      setCustomName('');
                    }
                  }}
                  placeholder="이름 입력 후 Enter 또는 추가 클릭"
                  className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
                <button
                  onClick={() => { if (customName.trim()) { addEditor(customName.trim()); setCustomName(''); } }}
                  disabled={!customName.trim()}
                  className={`px-3 py-1 text-xs rounded font-medium ${customName.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  추가
                </button>
              </div>
            </div>
            {/* 기존 직원 선택 */}
            <div>
              <div className="text-[10px] text-blue-600 mb-1 font-medium">또는 직원 클릭하여 추가 (소속 지점 자동 배정)</div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {uniqueNames.filter(n => !perms.some(p => p.name === n)).map(name => (
                  <button key={name} onClick={() => addEditor(name)}
                    className="px-2 py-0.5 text-[11px] bg-white border border-blue-200 rounded hover:bg-blue-100 text-blue-700">
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 에디터 테이블 */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b text-gray-500 sticky top-0">
                <th className="py-2 px-3 text-left font-medium">이름</th>
                <th className="py-2 px-3 text-left font-medium">역할</th>
                <th className="py-2 px-3 text-left font-medium">접근 지점</th>
                <th className="py-2 px-1 text-center font-medium w-24">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredEditors.map(editor => (
                <tr key={editor.name} className="border-b hover:bg-blue-50/50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">{editor.name}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">EDITOR</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      editor.branchCodes.includes('*') ? 'bg-purple-100 text-purple-700 font-semibold' : 'bg-gray-100 text-gray-600'
                    }`}>{getBranchLabel(editor.branchCodes)}</span>
                  </td>
                  <td className="py-2.5 px-1 text-center">
                    <button onClick={() => openEditModal(editor.name)} className="px-2 py-0.5 text-[10px] text-blue-600 hover:bg-blue-100 rounded mr-1 font-medium">편집</button>
                    <button onClick={() => removeEditor(editor.name)} className="px-2 py-0.5 text-[10px] text-red-500 hover:bg-red-50 rounded font-medium">해제</button>
                  </td>
                </tr>
              ))}
              {filteredEditors.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">에디터가 없습니다</td></tr>
              )}
            </tbody>
          </table>
          {filteredViewers.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-t text-[10px] text-gray-500 font-medium">
              뷰어 ({filteredViewers.length}명) — &quot;에디터 추가&quot;로 권한 부여
            </div>
          )}
        </div>

        {/* 저장 */}
        <div className="p-3 border-t bg-gray-50 flex items-center justify-between gap-3">
          {saveMsg ? <span className="text-sm text-green-600 font-medium">저장 완료!</span>
           : hasChanges ? <span className="text-xs text-orange-500">변경사항이 있습니다</span>
           : <span className="text-xs text-gray-400">변경사항 없음</span>}
          <button onClick={handleSave} disabled={!hasChanges}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            저장
          </button>
        </div>
      </div>

      {/* 개별 편집 모달 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="text-base font-bold">{editingUser.name} 권한 편집</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">역할</label>
                <div className="flex gap-2">
                  <button onClick={() => setEditingUser({ ...editingUser, role: 'editor' })}
                    className={`px-4 py-2 text-sm rounded-lg font-medium border-2 transition ${
                      editingUser.role === 'editor' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    Editor
                  </button>
                  <button onClick={() => setEditingUser({ ...editingUser, role: 'viewer' })}
                    className={`px-4 py-2 text-sm rounded-lg font-medium border-2 transition ${
                      editingUser.role === 'viewer' ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    Viewer
                  </button>
                </div>
              </div>
              {editingUser.role === 'editor' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">접근 가능 지점</label>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingUser({ ...editingUser, branches: ['*'] })} className="text-[10px] text-blue-600 hover:underline">전체 선택</button>
                      <button onClick={() => setEditingUser({ ...editingUser, branches: [] })} className="text-[10px] text-gray-500 hover:underline">전체 해제</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {branches.map(b => {
                      const checked = editingUser.branches.includes('*') || editingUser.branches.includes(b.code);
                      return (
                        <label key={b.code} className="flex items-center gap-1.5 py-1 cursor-pointer hover:bg-gray-50 rounded px-1">
                          <input type="checkbox" checked={checked} onChange={() => toggleBranchInModal(b.code)} className="w-3 h-3 rounded" />
                          <span className={`text-[10px] leading-tight ${checked ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>{b.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={saveEditModal} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
