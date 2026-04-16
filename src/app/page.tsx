'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import BranchSidebar from '@/components/BranchSidebar';
import Header from '@/components/Header';
import MonthSelector from '@/components/MonthSelector';
import ScheduleGrid from '@/components/ScheduleGrid';
import EmployeeModal from '@/components/EmployeeModal';
import LoginModal from '@/components/LoginModal';
import AdminPanel from '@/components/AdminPanel';
import {
  branches,
  defaultEmployees,
  getEmployees,
  saveEmployees,
  generateScheduleData,
  Employee,
} from '@/data/mockData';
import {
  CurrentUser,
  getCurrentUser,
  logout,
  canEditSchedule,
  canEditLeaveRequest,
  canDeleteSchedule,
  canManageEmployees,
  isEditPeriod as checkEditPeriod,
  getAdminSettings,
} from '@/data/auth';
import { downloadAmaranthExcel, downloadAllBranchesAmaranth } from '@/data/amaranth';

export default function Home() {
  const [selectedBranch, setSelectedBranch] = useState('02');
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [masterLoginOpen, setMasterLoginOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees);
  const [hydrated, setHydrated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const year = 2026;

  useEffect(() => {
    setEmployees(getEmployees());
    setCurrentUser(getCurrentUser());
    setHydrated(true);
  }, []);

  const branch = branches.find(b => b.code === selectedBranch);
  const branchName = branch?.name || '';
  const branchEmployees = useMemo(() => employees.filter(e => e.code === selectedBranch), [employees, selectedBranch]);
  const scheduleData = useMemo(() => generateScheduleData(selectedBranch, selectedMonth, year, employees), [selectedBranch, selectedMonth, employees]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === selectedMonth;
  const todayIndex = isCurrentMonth ? today.getDate() - 1 : 0;
  let workingCount = 0, offCount = 0;
  branchEmployees.forEach(emp => {
    const cell = scheduleData[`${emp.code}-${emp.num}`]?.[todayIndex];
    if (cell && cell.shift && cell.shift.startsWith('#')) offCount++;
    else if (cell && cell.shift) workingCount++;
  });

  const settings = getAdminSettings();
  const editPeriod = checkEditPeriod() || settings.editPeriodOverride;
  const canEdit = canEditSchedule(currentUser, selectedBranch);
  const canEditLeave = canEditLeaveRequest(currentUser);
  const canDelete = canDeleteSchedule(currentUser, selectedBranch);
  const canManage = canManageEmployees(currentUser);
  const isMaster = currentUser?.role === 'master';

  const handleEmployeeUpdate = useCallback((emp: Employee, field: string, value: string) => {
    setEmployees(prev => {
      const updated = prev.map(e => e.code === emp.code && e.num === emp.num ? { ...e, [field]: value } : e);
      saveEmployees(updated);
      return updated;
    });
  }, []);

  const handleEmployeeAdd = useCallback((newEmp: Employee) => {
    setEmployees(prev => { const updated = [...prev, newEmp]; saveEmployees(updated); return updated; });
  }, []);

  const handleEmployeeDelete = useCallback((emp: Employee) => {
    setEmployees(prev => { const updated = prev.filter(e => !(e.code === emp.code && e.num === emp.num)); saveEmployees(updated); return updated; });
  }, []);

  const handleLogout = () => { logout(); setCurrentUser(null); };

  if (!hydrated) return null;

  // If not logged in, show name entry
  if (!currentUser) {
    return <LoginModal mode="name" onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <BranchSidebar selectedBranch={selectedBranch} onSelectBranch={setSelectedBranch} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile branch selector */}
        <div className="md:hidden bg-slate-800 text-white px-3 py-2">
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="w-full bg-slate-700 text-white text-sm rounded px-2 py-1.5 border border-slate-600"
          >
            {branches.map(b => (
              <option key={b.code} value={b.code}>{b.code}_{b.name}</option>
            ))}
          </select>
        </div>

        <Header
          branchName={branchName}
          branchCode={selectedBranch}
          month={selectedMonth}
          year={year}
          workingCount={workingCount}
          offCount={offCount}
          totalCount={branchEmployees.length}
          branchTo={branch?.to}
          isEditPeriod={editPeriod}
          currentUser={currentUser}
          onManageEmployees={canManage ? () => setEmployeeModalOpen(true) : undefined}
          onAdminPanel={isMaster ? () => setAdminPanelOpen(true) : undefined}
          onMasterLogin={!isMaster ? () => setMasterLoginOpen(true) : undefined}
          onLogout={handleLogout}
          onDownloadAmaranth={isMaster ? () => {
            downloadAmaranthExcel(selectedBranch, branchName, selectedMonth, year, employees, scheduleData);
          } : undefined}
          onDownloadAllAmaranth={isMaster ? () => {
            downloadAllBranchesAmaranth(selectedMonth, year, employees, (code) =>
              generateScheduleData(code, selectedMonth, year, employees)
            );
          } : undefined}
        />

        <div className="bg-gray-50 border-b border-gray-200 px-3 md:px-6 py-2 flex items-center justify-between">
          <MonthSelector selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
          <div className="text-xs text-gray-400 hidden sm:block">
            {canEdit ? '셀 클릭: 스케줄 편집 | 이름 더블클릭: 이름 수정' : '조회 전용 모드'}
          </div>
        </div>

        <ScheduleGrid
          branchCode={selectedBranch}
          month={selectedMonth}
          year={year}
          employees={employees}
          onEmployeeUpdate={canManage ? handleEmployeeUpdate : undefined}
          canEdit={canEdit}
          canEditLeave={canEditLeave}
          canDelete={canDelete}
        />
      </div>

      {canManage && (
        <EmployeeModal
          isOpen={employeeModalOpen}
          onClose={() => setEmployeeModalOpen(false)}
          branchCode={selectedBranch}
          employees={employees}
          onAdd={handleEmployeeAdd}
          onUpdate={handleEmployeeUpdate}
          onDelete={handleEmployeeDelete}
        />
      )}

      {isMaster && (
        <AdminPanel
          isOpen={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
          employees={employees}
        />
      )}

      {masterLoginOpen && (
        <LoginModal mode="master" onLogin={u => { setCurrentUser(u); setMasterLoginOpen(false); }} onClose={() => setMasterLoginOpen(false)} />
      )}
    </div>
  );
}
