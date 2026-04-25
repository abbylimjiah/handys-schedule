'use client';

import React, { useState, useEffect } from 'react';
import { Employee, Role, branches } from '@/data/mockData';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchCode: string;
  employees: Employee[];
  onAdd: (employee: Employee) => void;
  onUpdate: (employee: Employee, field: string, value: string) => void;
  onDelete: (employee: Employee) => void;
  onRenumber?: (branchCode: string) => void;
}

export default function EmployeeModal({
  isOpen,
  onClose,
  branchCode,
  employees,
  onAdd,
  onUpdate,
  onDelete,
  onRenumber,
}: EmployeeModalProps) {
  const [editingCell, setEditingCell] = useState<{ empKey: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('Mgr');
  const [newHireDate, setNewHireDate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const branchEmployees = employees.filter(e => e.code === branchCode).sort((a, b) => a.num - b.num);
  const branch = branches.find(b => b.code === branchCode);

  useEffect(() => {
    if (!isOpen) {
      setEditingCell(null);
      setShowAddForm(false);
      setConfirmDelete(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartEdit = (emp: Employee, field: string) => {
    const empKey = `${emp.code}-${emp.num}`;
    setEditingCell({ empKey, field });
    const v =
      field === 'name' ? emp.name :
      field === 'role' ? emp.role :
      field === 'hireDate' ? emp.hireDate :
      field === 'realName' ? (emp.realName || '') :
      field === 'empCode' ? (emp.empCode || '') :
      '';
    setEditValue(v);
  };

  const handleSaveEdit = (emp: Employee) => {
    if (editingCell) {
      onUpdate(emp, editingCell.field, editValue);
    }
    setEditingCell(null);
  };

  const handleAdd = () => {
    const maxNum = branchEmployees.reduce((max, e) => Math.max(max, e.num), 0);
    const branchName = branch?.name || '';
    onAdd({
      code: branchCode,
      branch: branchName,
      num: maxNum + 1,
      name: newName,
      role: newRole,
      hireDate: newHireDate,
    });
    setNewName('');
    setNewRole('Mgr');
    setNewHireDate('');
    setShowAddForm(false);
  };

  const handleConfirmDelete = (emp: Employee) => {
    onDelete(emp);
    setConfirmDelete(null);
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'Lead': return '리드';
      case 'HM': return 'HM';
      case 'Mgr': return '매니저';
      default: return role;
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/30 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="modal-content bg-white rounded-xl shadow-2xl w-[760px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-700 text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <span className="font-bold">{branch?.name || branchCode}</span>
            <span className="text-slate-300 text-sm ml-2">인원 관리</span>
            {branch?.to && (
              <span className="text-xs bg-slate-600 px-2 py-0.5 rounded ml-2">
                TO: {branch.to}명 / 현재: {branchEmployees.length}명
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRenumber && branchEmployees.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('직원 순서를 1, 2, 3... 순으로 재정렬합니다. 계속하시겠습니까?')) {
                    onRenumber(branchCode);
                  }
                }}
                className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded"
                title="직원 번호를 1부터 순차 재정렬"
              >
                🔢 순서 정리
              </button>
            )}
            <button onClick={onClose} className="text-slate-300 hover:text-white text-lg">
              &times;
            </button>
          </div>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2 w-8">No</th>
                <th className="py-2">닉네임</th>
                <th className="py-2 w-24">실명</th>
                <th className="py-2 w-20">사번</th>
                <th className="py-2 w-16">직책</th>
                <th className="py-2 w-24">입사일</th>
                <th className="py-2 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {branchEmployees.map(emp => {
                const empKey = `${emp.code}-${emp.num}`;
                const isDeleting = confirmDelete === empKey;

                return (
                  <tr key={empKey} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 text-gray-400 font-mono text-xs">{emp.num}</td>
                    <td className="py-2">
                      {editingCell?.empKey === empKey && editingCell.field === 'name' ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(emp)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(emp);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="px-2 py-0.5 border border-blue-400 rounded text-sm focus:outline-none bg-blue-50 w-full"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartEdit(emp, 'name')}
                          className={`cursor-pointer hover:text-blue-600 ${emp.name ? 'text-gray-800' : 'text-gray-300 italic'}`}
                        >
                          {emp.name || '(미정)'}
                        </span>
                      )}
                    </td>
                    {/* 실명 */}
                    <td className="py-2 text-xs">
                      {editingCell?.empKey === empKey && editingCell.field === 'realName' ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(emp)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(emp);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          placeholder="한글 이름"
                          className="px-2 py-0.5 border border-blue-400 rounded text-xs focus:outline-none bg-blue-50 w-full"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartEdit(emp, 'realName')}
                          className={`cursor-pointer hover:text-blue-600 ${emp.realName ? 'text-gray-700' : 'text-red-400 italic'}`}
                          title="클릭하여 실명 편집"
                        >
                          {emp.realName || '⚠️ 미입력'}
                        </span>
                      )}
                    </td>
                    {/* 사번 */}
                    <td className="py-2 text-xs font-mono">
                      {editingCell?.empKey === empKey && editingCell.field === 'empCode' ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(emp)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(emp);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          placeholder="21049"
                          className="px-2 py-0.5 border border-blue-400 rounded text-xs focus:outline-none bg-blue-50 w-full"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartEdit(emp, 'empCode')}
                          className={`cursor-pointer hover:text-blue-600 ${emp.empCode ? 'text-gray-600' : 'text-red-400 italic'}`}
                          title="클릭하여 사번 편집"
                        >
                          {emp.empCode || '⚠️'}
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      {editingCell?.empKey === empKey && editingCell.field === 'role' ? (
                        <select
                          autoFocus
                          value={editValue}
                          onChange={e => {
                            setEditValue(e.target.value);
                          }}
                          onBlur={() => handleSaveEdit(emp)}
                          className="px-1 py-0.5 border border-blue-400 rounded text-xs focus:outline-none bg-blue-50"
                        >
                          <option value="HM">HM</option>
                          <option value="Mgr">매니저</option>
                          <option value="Lead">리드</option>
                        </select>
                      ) : (
                        <span
                          onClick={() => handleStartEdit(emp, 'role')}
                          className={`cursor-pointer text-xs font-semibold px-1.5 py-0.5 rounded ${
                            emp.role === 'HM'
                              ? 'bg-indigo-100 text-indigo-700'
                              : emp.role === 'Lead'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {roleLabel(emp.role)}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-xs text-gray-500">
                      {editingCell?.empKey === empKey && editingCell.field === 'hireDate' ? (
                        <input
                          autoFocus
                          type="date"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(emp)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(emp);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="px-1 py-0.5 border border-blue-400 rounded text-xs focus:outline-none bg-blue-50"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartEdit(emp, 'hireDate')}
                          className={`cursor-pointer inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition ${emp.hireDate ? 'text-gray-600' : 'text-gray-300 italic'}`}
                          title="클릭하여 입사일 편집"
                        >
                          {emp.hireDate || '(입력)'}
                          <span className="text-[10px] text-gray-300">✏</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {isDeleting ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleConfirmDelete(emp)}
                            className="text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(empKey)}
                          className="text-gray-300 hover:text-red-500 text-sm"
                          title="삭제"
                        >
                          &times;
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add form */}
          {showAddForm ? (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="이름"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                />
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as Role)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                >
                  <option value="HM">HM</option>
                  <option value="Mgr">매니저</option>
                  <option value="Lead">리드</option>
                </select>
                <input
                  type="date"
                  value={newHireDate}
                  onChange={e => setNewHireDate(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + 인원 추가
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
