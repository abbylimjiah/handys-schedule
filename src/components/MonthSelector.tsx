'use client';

import React from 'react';

interface MonthSelectorProps {
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
}

const months = [
  { value: 1, label: '1월' },
  { value: 2, label: '2월' },
  { value: 3, label: '3월' },
  { value: 4, label: '4월' },
  { value: 5, label: '5월' },
  { value: 6, label: '6월' },
  { value: 7, label: '7월' },
  { value: 8, label: '8월' },
  { value: 9, label: '9월' },
  { value: 10, label: '10월' },
  { value: 11, label: '11월' },
  { value: 12, label: '12월' },
];

export default function MonthSelector({ selectedMonth, onSelectMonth }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 py-1 shadow-sm">
      {months.map(m => (
        <button
          key={m.value}
          onClick={() => onSelectMonth(m.value)}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
            selectedMonth === m.value
              ? 'bg-slate-700 text-white shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
