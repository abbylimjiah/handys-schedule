'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import BranchSidebar from '@/components/BranchSidebar';
import Header from '@/components/Header';
import MonthSelector from '@/components/MonthSelector';
import ScheduleGrid from '@/components/ScheduleGrid';
import EmployeeModal from '@/components/EmployeeModal';
import {
  branches,
  defaultEmployees,
  getEmployees,
  saveEmployees,
  generateScheduleData,
  Employee,
} from '@/data/mockData';

export default function Home() {
  const [selectedBranch, setSelectedBranch] = useState('02');
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees);
  const [hydrated, setHydrated] = useState(false);
  const year = 2026;

  // Load employees from localStorage on mount (override defaults if saved data exists)
  useEffect(() => {
    setEmployees(getEmployees());
    setHydrated(true);
  }, []);

  const branch = branches.find(b => b.code === selectedBranch);
  const branchName = branch?.name || '';

  const branchEmployees = useMemo(
    () => employees.filter(e => e.code === selectedBranch),
    [employees, selectedBranch]
  );

  const scheduleData = useMemo(
    () => generateScheduleData(selectedBranch, selectedMonth, year, employees),
    [selectedBranch, selectedMonth, employees]
  );

  // Calculate daily stats for today
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === selectedMonth;
  const todayIndex = isCurrentMonth ? today.getDate() - 1 : 0;
  let workingCount = 0;
  let offCount = 0;
  branchEmployees.forEach(emp => {
    const empKey = `${emp.code}-${emp.num}`;
    const cell = scheduleData[empKey]?.[todayIndex];
    if (cell && cell.shift.startsWith('#')) {
      offCount++;
    } else {
      workingCount++;
    }
  });

  const currentDay = today.getDate();
  const isEditPeriod = currentDay >= 20 && currentDay <= 24;

  // Employee management callbacks
  const handleEmployeeUpdate = useCallback((emp: Employee, field: string, value: string) => {
    setEmployees(prev => {
      const updated = prev.map(e => {
        if (e.code === emp.code && e.num === emp.num) {
          return { ...e, [field]: value };
        }
        return e;
      });
      saveEmployees(updated);
      return updated;
    });
  }, []);

  const handleEmployeeAdd = useCallback((newEmp: Employee) => {
    setEmployees(prev => {
      const updated = [...prev, newEmp];
      saveEmployees(updated);
      return updated;
    });
  }, []);

  const handleEmployeeDelete = useCallback((emp: Employee) => {
    setEmployees(prev => {
      const updated = prev.filter(e => !(e.code === emp.code && e.num === emp.num));
      saveEmployees(updated);
      return updated;
    });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <BranchSidebar
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          branchName={branchName}
          branchCode={selectedBranch}
          month={selectedMonth}
          year={year}
          workingCount={workingCount}
          offCount={offCount}
          totalCount={branchEmployees.length}
          branchTo={branch?.to}
          isEditPeriod={isEditPeriod}
          onManageEmployees={() => setEmployeeModalOpen(true)}
        />

        {/* Month selector bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex items-center justify-between">
          <MonthSelector
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
          <div className="text-xs text-gray-400">
            셀 클릭: 스케줄 편집 | 이름 더블클릭: 이름 수정
          </div>
        </div>

        {/* Schedule grid */}
        <ScheduleGrid
          branchCode={selectedBranch}
          month={selectedMonth}
          year={year}
          employees={employees}
          onEmployeeUpdate={handleEmployeeUpdate}
        />
      </div>

      {/* Employee management modal */}
      <EmployeeModal
        isOpen={employeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        branchCode={selectedBranch}
        employees={employees}
        onAdd={handleEmployeeAdd}
        onUpdate={handleEmployeeUpdate}
        onDelete={handleEmployeeDelete}
      />
    </div>
  );
}
