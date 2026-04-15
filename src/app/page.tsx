'use client';

import React, { useState, useMemo } from 'react';
import BranchSidebar from '@/components/BranchSidebar';
import Header from '@/components/Header';
import MonthSelector from '@/components/MonthSelector';
import ScheduleGrid from '@/components/ScheduleGrid';
import { branches, employees, generateScheduleData } from '@/data/mockData';

export default function Home() {
  const [selectedBranch, setSelectedBranch] = useState('02'); // Default to 서면
  const [selectedMonth, setSelectedMonth] = useState(4); // April 2026
  const year = 2026;

  const branch = branches.find(b => b.code === selectedBranch);
  const branchName = branch?.name || '';

  // Calculate daily summary stats (for "today" April 16)
  const branchEmployees = employees.filter(e => e.code === selectedBranch);
  const scheduleData = useMemo(
    () => generateScheduleData(selectedBranch, selectedMonth, year),
    [selectedBranch, selectedMonth]
  );

  const todayIndex = 15; // April 16 = index 15
  let workingCount = 0;
  let offCount = 0;
  branchEmployees.forEach(emp => {
    const empKey = `${emp.code}-${emp.num}`;
    const cell = scheduleData[empKey]?.[todayIndex];
    if (cell && cell.shift === '#') {
      offCount++;
    } else {
      workingCount++;
    }
  });

  // Check if current date is within edit period (20th-24th)
  const today = new Date();
  const currentDay = today.getDate();
  const isEditPeriod = currentDay >= 20 && currentDay <= 24;

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
          isEditPeriod={isEditPeriod}
        />

        {/* Month selector bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex items-center justify-between">
          <MonthSelector
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
          <div className="text-xs text-gray-400">
            셀을 클릭하여 상세 정보를 확인/편집하세요
          </div>
        </div>

        {/* Schedule grid */}
        <ScheduleGrid
          branchCode={selectedBranch}
          month={selectedMonth}
          year={year}
        />
      </div>
    </div>
  );
}
