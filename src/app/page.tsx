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
  getHMBranch,
  getUserHomeBranch,
} from '@/data/auth';
import { downloadAmaranthExcel, downloadAllBranchesAmaranth } from '@/data/amaranth';
import { fetchEmployees, saveBranchEmployees, subscribeToEmployees } from '@/lib/employeesApi';

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
    // 초기값은 localStorage로 빠르게 설정
    const initialEmps = getEmployees();
    setEmployees(initialEmps);
    const user = getCurrentUser();
    setCurrentUser(user);

    // 초기 지점 선택 로직 (사용자별로 개별 저장):
    // 1순위: 본인 소속 지점 (첫 화면은 항상 본인 지점)
    // 2순위: 본인이 마지막으로 본 지점 (사용자별 저장)
    // 3순위: 기본 '02' (서면)
    const userLastBranchKey = user ? `handys-last-branch-${user.name.toLowerCase().trim()}` : 'handys-last-branch';
    try {
      if (user) {
        // 본인 지점 우선 (첫 로그인 시)
        const homeBranch = getUserHomeBranch(user.name, initialEmps);
        const userLastBranch = localStorage.getItem(userLastBranchKey);
        // 본인이 이전에 봤던 지점이 있으면 그걸 사용 (아니면 본인 지점)
        if (userLastBranch) {
          setSelectedBranch(userLastBranch);
        } else if (homeBranch) {
          setSelectedBranch(homeBranch);
        }
      }
    } catch {}

    setHydrated(true);

    // Supabase에서 최신 데이터 불러오기
    (async () => {
      const emps = await fetchEmployees();
      if (emps && emps.length > 0) {
        setEmployees(emps);
        // 본인 지점 재확인 (Supabase 데이터로)
        if (user && !localStorage.getItem(userLastBranchKey)) {
          const homeBranch = getUserHomeBranch(user.name, emps);
          if (homeBranch) setSelectedBranch(homeBranch);
        }
      }
    })();

    // 실시간 구독: 다른 사람이 직원 정보 수정하면 자동 반영
    const unsubscribe = subscribeToEmployees(emps => setEmployees(emps));
    return unsubscribe;
  }, []);

  // 지점 변경 시 localStorage에 저장 (사용자별)
  useEffect(() => {
    if (hydrated && currentUser) {
      try {
        const key = `handys-last-branch-${currentUser.name.toLowerCase().trim()}`;
        localStorage.setItem(key, selectedBranch);
      } catch {}
    }
  }, [selectedBranch, hydrated, currentUser]);

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
  const canEdit = canEditSchedule(currentUser, selectedBranch, employees);
  const canEditLeave = canEditLeaveRequest(currentUser);
  const canDelete = canDeleteSchedule(currentUser, selectedBranch, employees);
  const canManage = canManageEmployees(currentUser);
  const isMaster = currentUser?.role === 'master';
  const isHMBranch = currentUser ? getHMBranch(currentUser.name, employees) === selectedBranch : false;

  const handleEmployeeUpdate = useCallback((emp: Employee, field: string, value: string) => {
    setEmployees(prev => {
      const updated = prev.map(e => e.code === emp.code && e.num === emp.num ? { ...e, [field]: value } : e);
      saveEmployees(updated);
      saveBranchEmployees(emp.code, updated);
      return updated;
    });
  }, []);

  const handleEmployeeAdd = useCallback((newEmp: Employee) => {
    setEmployees(prev => {
      const updated = [...prev, newEmp];
      saveEmployees(updated);
      saveBranchEmployees(newEmp.code, updated);
      return updated;
    });
  }, []);

  const handleEmployeeDelete = useCallback((emp: Employee) => {
    setEmployees(prev => {
      const updated = prev.filter(e => !(e.code === emp.code && e.num === emp.num));
      saveEmployees(updated);
      saveBranchEmployees(emp.code, updated);
      return updated;
    });
  }, []);

  const handleEmployeeRenumber = useCallback((branchCode: string) => {
    setEmployees(prev => {
      const branchEmps = prev.filter(e => e.code === branchCode).sort((a, b) => a.num - b.num);
      const others = prev.filter(e => e.code !== branchCode);
      const renumbered = branchEmps.map((emp, idx) => ({ ...emp, num: idx + 1 }));
      const updated = [...others, ...renumbered];
      saveEmployees(updated);
      saveBranchEmployees(branchCode, updated);
      return updated;
    });
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
          canEdit={canEdit}
          isHMBranch={isHMBranch}
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
          onRenumber={handleEmployeeRenumber}
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
