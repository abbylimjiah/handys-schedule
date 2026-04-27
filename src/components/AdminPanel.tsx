'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminSettings, ManagedUser, ManagedRole,
  getAdminSettings, saveAdminSettings,
  getMasterPassword, setMasterPassword,
  getManagedUsers, saveManagedUsers, initManagedUsers, findMissingManagedUsers,
} from '@/data/auth';
import { Employee, branches, defaultEmployees } from '@/data/mockData';
import { employeeRoster } from '@/data/amaranth';
import { fetchManagedUsers, bulkSaveManagedUsers, subscribeToManagedUsers } from '@/lib/usersApi';
import { bulkUploadEmployees } from '@/lib/employeesApi';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
}

interface EditingUser {
  englishName: string;
  koreanName: string;
  email: string;
  role: ManagedRole;
  branches: string[];
  homeBranch: string;
  homeBranchName: string;
  status: 'active' | 'blocked';
  isNew?: boolean;
}

export default function AdminPanel({ isOpen, onClose, employees }: AdminPanelProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEnglish, setNewEnglish] = useState('');
  const [newKorean, setNewKorean] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      const managed = initManagedUsers(employees, employeeRoster);
      setUsers(managed);
      setSettings(getAdminSettings());
      setEditingUser(null);
      setShowAddForm(false);
      setSearch('');

      // Supabase에서 최신 사용자 불러오기
      (async () => {
        const fetched = await fetchManagedUsers();
        if (fetched && fetched.length > 0) {
          // 누락된 직원 자동 병합 (인원관리에 추가됐지만 권한관리에 없는 사람)
          const missing = findMissingManagedUsers(employees, fetched, employeeRoster);
          if (missing.length > 0) {
            const merged = [...fetched, ...missing];
            setUsers(merged);
            saveManagedUsers(merged);
            bulkSaveManagedUsers(merged); // Supabase 동기화
            console.log(`[권한관리] 누락된 직원 ${missing.length}명 자동 추가:`, missing.map(m => m.englishName));
          } else {
            setUsers(fetched);
            saveManagedUsers(fetched); // localStorage 싱크
          }
        } else if (managed.length > 0) {
          // 최초 1회 기본 데이터 서버 업로드
          bulkSaveManagedUsers(managed);
        }
      })();

      // 실시간 구독
      const unsub = subscribeToManagedUsers(users => {
        setUsers(users);
        saveManagedUsers(users);
      });
      return unsub;
    }
  }, [isOpen, employees]);

  if (!isOpen) return null;

  const getBranchLabel = (codes: string[]) => {
    if (!codes || codes.length === 0) return '';
    if (codes.includes('*')) return '전체 지점';
    if (codes.length === 1) {
      const b = branches.find(br => br.code === codes[0]);
      return b ? b.name + '점' : codes[0];
    }
    return `${codes.length}개 지점`;
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.englishName.toLowerCase().includes(q) ||
      u.koreanName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
  }).sort((a, b) => a.koreanName.localeCompare(b.koreanName, 'ko'));

  const roleLabel = (role: ManagedRole) => {
    switch (role) {
      case 'branch': return 'BRANCH';
      case 'viewer': return 'VIEWER';
      case 'master': return 'MASTER';
    }
  };

  const roleBadgeCls = (role: ManagedRole) => {
    switch (role) {
      case 'branch': return 'bg-blue-600 text-white';
      case 'viewer': return 'bg-gray-200 text-gray-600';
      case 'master': return 'bg-red-600 text-white';
    }
  };

  const handleToggleStatus = (name: string) => {
    const updated = users.map(u =>
      u.englishName === name ? { ...u, status: (u.status === 'active' ? 'blocked' : 'active') as 'active' | 'blocked' } : u
    );
    setUsers(updated);
    saveManagedUsers(updated);
    bulkSaveManagedUsers(updated); // Supabase 동기화
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser({ ...user });
  };

  const saveEditModal = () => {
    if (!editingUser) return;
    if (editingUser.isNew) {
      const newUser: ManagedUser = {
        englishName: editingUser.englishName,
        koreanName: editingUser.koreanName,
        email: editingUser.email,
        role: editingUser.role,
        branches: editingUser.branches,
        homeBranch: editingUser.homeBranch,
        homeBranchName: editingUser.homeBranchName,
        status: editingUser.status,
      };
      const updated = [...users, newUser];
      setUsers(updated);
      saveManagedUsers(updated);
      bulkSaveManagedUsers(updated); // Supabase 동기화
    } else {
      const updated = users.map(u =>
        u.englishName === editingUser.englishName ? {
          ...u,
          koreanName: editingUser.koreanName,
          email: editingUser.email,
          role: editingUser.role,
          branches: editingUser.branches,
          status: editingUser.status,
        } : u
      );
      setUsers(updated);
      saveManagedUsers(updated);
      bulkSaveManagedUsers(updated); // Supabase 동기화
    }
    setEditingUser(null);
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

  const handleAddUser = () => {
    if (!newEnglish.trim()) return;
    if (users.some(u => u.englishName === newEnglish.trim())) return;
    setEditingUser({
      englishName: newEnglish.trim(),
      koreanName: newKorean.trim(),
      email: newEmail.trim(),
      role: 'viewer',
      branches: [],
      homeBranch: '',
      homeBranchName: '',
      status: 'active',
      isNew: true,
    });
    setShowAddForm(false);
    setNewEnglish('');
    setNewKorean('');
    setNewEmail('');
  };

  const toggleEditPeriod = () => {
    const updated = { ...settings, editPeriodOverride: !settings.editPeriodOverride };
    setSettings(updated);
    saveAdminSettings(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">권한 관리</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">총 {users.length}명</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
        </div>

        {/* Settings bar */}
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.editPeriodOverride} onChange={toggleEditPeriod} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium">편집 기간 오버라이드</span>
            <span className="text-xs text-gray-400">(20~24일 외 허용)</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (!confirm('전체 직원 데이터를 기본값으로 초기화합니다. 계속하시겠습니까?\n\n(HM 편집 권한 문제 해결용 - 현재 서버의 직원 정보를 기본 데이터로 덮어씁니다)')) return;
                const ok = await bulkUploadEmployees(defaultEmployees);
                alert(ok ? '✅ 직원 데이터 재동기화 완료! 새로고침하세요.' : '❌ 동기화 실패. 콘솔 확인.');
              }}
              className="text-xs text-orange-600 hover:underline"
              title="HM 편집 권한이 없다면 여기 클릭 (직원 데이터 초기화)"
            >
              🔄 직원 데이터 재동기화
            </button>
            <button onClick={() => { setShowPwChange(!showPwChange); setPwMsg(null); }} className="text-xs text-blue-600 hover:underline">🔑 비밀번호 변경</button>
          </div>
        </div>
        {showPwChange && (
          <div className="px-5 py-2 border-b bg-gray-50 flex gap-2 items-end flex-wrap">
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

        {/* Search + Add */}
        <div className="px-5 py-3 border-b flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름 또는 이메일로 검색..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap">
            + 사용자 추가
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-5 py-3 border-b bg-blue-50">
            <div className="flex gap-2 items-end flex-wrap">
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">영문명 *</label>
                <input type="text" value={newEnglish} onChange={e => setNewEnglish(e.target.value)} placeholder="English name"
                  className="px-2 py-1.5 text-sm border rounded w-32 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">이름</label>
                <input type="text" value={newKorean} onChange={e => setNewKorean(e.target.value)} placeholder="한글 이름"
                  className="px-2 py-1.5 text-sm border rounded w-28 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-0.5">이메일</label>
                <input type="text" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@handys.co.kr"
                  className="px-2 py-1.5 text-sm border rounded w-48 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddUser(); }} />
              </div>
              <button onClick={handleAddUser} disabled={!newEnglish.trim()}
                className={`px-4 py-1.5 text-sm rounded font-medium ${newEnglish.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                추가
              </button>
              <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">취소</button>
            </div>
          </div>
        )}

        {/* User Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 sticky top-0">
                <th className="py-3 px-4 text-left font-medium">이름</th>
                <th className="py-3 px-3 text-left font-medium">영문명</th>
                <th className="py-3 px-3 text-left font-medium">이메일</th>
                <th className="py-3 px-3 text-left font-medium w-20">역할</th>
                <th className="py-3 px-3 text-left font-medium">지점</th>
                <th className="py-3 px-2 text-center font-medium w-14">상태</th>
                <th className="py-3 px-2 text-center font-medium w-28"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.englishName} className="border-b hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{user.koreanName || '-'}</td>
                  <td className="py-3 px-3 text-gray-700">{user.englishName}</td>
                  <td className="py-3 px-3 text-gray-500 text-xs">{user.email || <span className="text-gray-300">-</span>}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleBadgeCls(user.role)}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {user.role === 'branch' ? (
                      <span className="text-xs px-2 py-0.5 border border-gray-300 rounded text-gray-600">
                        {getBranchLabel(user.branches)}
                      </span>
                    ) : user.homeBranchName ? (
                      <span className="text-xs text-gray-400">{user.homeBranchName}</span>
                    ) : null}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      user.status === 'active'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                        : 'bg-white text-gray-400 border-gray-300'
                    }`}>
                      {user.status === 'active' ? '활성' : '차단'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => openEditModal(user)}
                        className="px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-100 rounded font-medium">편집</button>
                      <button onClick={() => handleToggleStatus(user.englishName)}
                        className={`px-2 py-1 text-[11px] rounded font-bold ${
                          user.status === 'active'
                            ? 'bg-gray-700 text-white hover:bg-gray-800'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}>
                        {user.status === 'active' ? '차단' : '활성화'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">검색 결과가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUser.koreanName || editingUser.englishName}
                {editingUser.email && <span className="text-sm text-gray-400 font-normal ml-2">({editingUser.email})</span>}
                {' '}권한 편집
              </h3>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* 이름 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">이름:</label>
                <div className="flex gap-2">
                  <input type="text" value={editingUser.koreanName}
                    onChange={e => setEditingUser({ ...editingUser, koreanName: e.target.value })}
                    placeholder="한글 이름" className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
                  <input type="text" value={editingUser.englishName}
                    onChange={e => editingUser.isNew ? setEditingUser({ ...editingUser, englishName: e.target.value }) : undefined}
                    readOnly={!editingUser.isNew}
                    placeholder="English name"
                    className={`w-36 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none ${editingUser.isNew ? 'focus:border-blue-400' : 'bg-gray-50 text-gray-500'}`} />
                </div>
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">이메일:</label>
                <input type="email" value={editingUser.email}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="email@handys.co.kr"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
              </div>

              {/* 역할 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">역할:</label>
                <div className="flex gap-2">
                  {(['branch', 'viewer', 'master'] as ManagedRole[]).map(r => (
                    <button key={r} onClick={() => setEditingUser({ ...editingUser, role: r })}
                      className={`px-5 py-2.5 text-sm rounded-lg font-semibold border-2 transition ${
                        editingUser.role === r
                          ? r === 'branch' ? 'border-blue-500 bg-blue-600 text-white'
                            : r === 'master' ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-500 bg-gray-50 text-gray-700'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}>
                      {r === 'branch' ? 'Branch' : r === 'viewer' ? 'Viewer' : 'Master'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 지점 체크박스 (branch 역할일 때만) */}
              {editingUser.role === 'branch' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">접근 가능 지점:</label>
                    <div className="flex gap-3">
                      <button onClick={() => setEditingUser({ ...editingUser, branches: ['*'] })} className="text-xs text-blue-600 hover:underline font-medium">전체 선택</button>
                      <button onClick={() => setEditingUser({ ...editingUser, branches: [] })} className="text-xs text-gray-500 hover:underline">전체 해제</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto border-2 border-gray-200 rounded-lg p-3">
                    {branches.map(b => {
                      const checked = editingUser.branches.includes('*') || editingUser.branches.includes(b.code);
                      return (
                        <label key={b.code} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-1.5">
                          <input type="checkbox" checked={checked} onChange={() => toggleBranchInModal(b.code)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                          <span className={`text-xs leading-tight ${checked ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                            {b.name}{b.region !== '본사' ? '점' : ''}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">취소</button>
              <button onClick={saveEditModal} className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
