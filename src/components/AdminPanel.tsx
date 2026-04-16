'use client';

import React, { useState, useEffect } from 'react';
import { getAdminSettings, saveAdminSettings, getMasterPassword, setMasterPassword } from '@/data/auth';
import { Employee } from '@/data/mockData';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
}

export default function AdminPanel({ isOpen, onClose, employees }: AdminPanelProps) {
  const [settings, setSettings] = useState(getAdminSettings());
  const [search, setSearch] = useState('');
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) setSettings(getAdminSettings());
  }, [isOpen]);

  if (!isOpen) return null;

  const uniqueNames = Array.from(new Set(employees.map(e => e.name))).sort();
  const filtered = search ? uniqueNames.filter(n => n.includes(search)) : uniqueNames;

  const toggleEditor = (name: string) => {
    const newSettings = { ...settings };
    if (newSettings.grantedEditors.includes(name)) {
      newSettings.grantedEditors = newSettings.grantedEditors.filter(n => n !== name);
    } else {
      newSettings.grantedEditors = [...newSettings.grantedEditors, name];
    }
    setSettings(newSettings);
    saveAdminSettings(newSettings);
  };

  const toggleEditPeriod = () => {
    const newSettings = { ...settings, editPeriodOverride: !settings.editPeriodOverride };
    setSettings(newSettings);
    saveAdminSettings(newSettings);
  };

  const selectAll = () => {
    const newSettings = { ...settings, grantedEditors: [...uniqueNames] };
    setSettings(newSettings);
    saveAdminSettings(newSettings);
  };

  const deselectAll = () => {
    const newSettings = { ...settings, grantedEditors: [] };
    setSettings(newSettings);
    saveAdminSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
                <input
                  type="password"
                  value={currentPw}
                  onChange={e => { setCurrentPw(e.target.value); setPwMsg(null); }}
                  placeholder="현재 비밀번호"
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  type="password"
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwMsg(null); }}
                  placeholder="새 비밀번호 (4자 이상)"
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setPwMsg(null); }}
                  placeholder="새 비밀번호 확인"
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                {pwMsg && (
                  <p className={`text-xs ${pwMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{pwMsg.text}</p>
                )}
                <button
                  onClick={() => {
                    if (currentPw !== getMasterPassword()) {
                      setPwMsg({ type: 'err', text: '현재 비밀번호가 틀렸습니다' });
                      return;
                    }
                    if (newPw.length < 4) {
                      setPwMsg({ type: 'err', text: '새 비밀번호는 4자 이상이어야 합니다' });
                      return;
                    }
                    if (newPw !== confirmPw) {
                      setPwMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다' });
                      return;
                    }
                    setMasterPassword(newPw);
                    setPwMsg({ type: 'ok', text: '비밀번호가 변경되었습니다!' });
                    setCurrentPw(''); setNewPw(''); setConfirmPw('');
                  }}
                  className="w-full py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  변경하기
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-b space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">에디터 권한 부여 ({settings.grantedEditors.length}/{uniqueNames.length})</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">전체선택</button>
              <button onClick={deselectAll} className="text-xs text-gray-500 hover:underline">전체해제</button>
            </div>
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
            {filtered.map(name => (
              <label key={name} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.grantedEditors.includes(name)}
                  onChange={() => toggleEditor(name)}
                  className="w-3.5 h-3.5 rounded"
                />
                <span className="text-sm">{name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
