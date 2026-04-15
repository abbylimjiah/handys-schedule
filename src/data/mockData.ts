// Types
export type ShiftType = 'D6' | 'D9' | 'M' | 'E' | 'N' | '#' | 'D9/반' | 'E/반' | 'D6/반' | '';
export type Role = 'Lead' | 'HM' | 'Mgr';

export interface Employee {
  code: string;
  branch: string;
  num: number;
  name: string;
  role: Role;
  hireDate: string;
}

export interface CellData {
  shift: ShiftType;
  leaveRequest: boolean;  // 연차상신
  kakaoT: boolean;        // 카카오T
  memo: string;
}

export interface Branch {
  code: string;
  name: string;
  region: string;
}

// All 29 branches grouped by region
export const branches: Branch[] = [
  { code: '01', name: 'HQ', region: '본사' },
  { code: '04', name: '명동', region: '서울' },
  { code: '26', name: '동탄', region: '수도권' },
  { code: '27', name: '시흥웨이브파크', region: '수도권' },
  { code: '29', name: '시흥거북섬', region: '수도권' },
  { code: '30', name: '인천차이나타운', region: '수도권' },
  { code: '28', name: '당진터미널', region: '충청' },
  { code: '02', name: '서면', region: '부산' },
  { code: '06', name: '부산역', region: '부산' },
  { code: '11', name: '부산시청', region: '부산' },
  { code: '12', name: '부산기장', region: '부산' },
  { code: '13', name: '남포BIFF', region: '부산' },
  { code: '15', name: '해운대역', region: '부산' },
  { code: '16', name: '해운대패러그라프', region: '부산' },
  { code: '17', name: '부산송도해변', region: '부산' },
  { code: '07', name: '송도달빛공원', region: '수도권' },
  { code: '14', name: '스타즈울산', region: '울산' },
  { code: '05', name: '제주공항', region: '제주' },
  { code: '31', name: '호텔동탄', region: '수도권' },
  { code: '08', name: '속초해변C', region: '속초/강원' },
  { code: '10', name: '속초등대해변', region: '속초/강원' },
  { code: '20', name: '속초해변', region: '속초/강원' },
  { code: '21', name: '속초중앙', region: '속초/강원' },
  { code: '22', name: '속초자이엘라', region: '속초/강원' },
  { code: '23', name: '속초해변AB', region: '속초/강원' },
  { code: '24', name: '낙산해변', region: '속초/강원' },
  { code: '25', name: '양양', region: '속초/강원' },
  { code: '33', name: '플라트 더 각 양양', region: '속초/강원' },
];

// Unique region list for grouping
export const regions = ['본사', '서울', '수도권', '충청', '부산', '울산', '제주', '속초/강원'];

// Full employee roster
export const employees: Employee[] = [
  { code: '01', branch: 'HQ', num: 1, name: 'Abby', role: 'Lead', hireDate: '2021-09-01' },
  { code: '01', branch: 'HQ', num: 2, name: 'Nell', role: 'Lead', hireDate: '2022-06-27' },
  { code: '01', branch: 'HQ', num: 3, name: 'Diana', role: 'Lead', hireDate: '2022-08-08' },
  { code: '01', branch: 'HQ', num: 4, name: 'Miles', role: 'Lead', hireDate: '2023-05-15' },
  { code: '02', branch: '서면', num: 1, name: 'Leo', role: 'HM', hireDate: '2021-05-24' },
  { code: '02', branch: '서면', num: 2, name: 'Alexander', role: 'Mgr', hireDate: '2023-01-09' },
  { code: '02', branch: '서면', num: 3, name: 'Bonny', role: 'Mgr', hireDate: '2022-04-18' },
  { code: '02', branch: '서면', num: 4, name: 'Hwan', role: 'Mgr', hireDate: '2022-07-25' },
  { code: '02', branch: '서면', num: 5, name: 'Teri', role: 'Mgr', hireDate: '2023-01-30' },
  { code: '02', branch: '서면', num: 6, name: 'Sen', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '04', branch: '명동', num: 1, name: 'Road', role: 'HM', hireDate: '2023-09-18' },
  { code: '04', branch: '명동', num: 2, name: 'Jennie', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '04', branch: '명동', num: 3, name: 'Sophia', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '04', branch: '명동', num: 4, name: 'Joyce', role: 'Mgr', hireDate: '2025-10-27' },
  { code: '05', branch: '제주공항', num: 1, name: 'Eiden', role: 'HM', hireDate: '2021-09-06' },
  { code: '05', branch: '제주공항', num: 2, name: 'Callia', role: 'Mgr', hireDate: '2022-06-20' },
  { code: '05', branch: '제주공항', num: 3, name: 'Liz', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '05', branch: '제주공항', num: 4, name: 'Neko', role: 'Mgr', hireDate: '2026-03-16' },
  { code: '06', branch: '부산역', num: 1, name: 'Stan', role: 'HM', hireDate: '2022-06-20' },
  { code: '06', branch: '부산역', num: 2, name: 'Journey', role: 'Mgr', hireDate: '2022-08-22' },
  { code: '06', branch: '부산역', num: 3, name: 'Caesar', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '06', branch: '부산역', num: 4, name: 'Wonnie', role: 'Mgr', hireDate: '2024-06-03' },
  { code: '07', branch: '송도달빛공원', num: 1, name: 'Kyle', role: 'HM', hireDate: '2022-04-18' },
  { code: '07', branch: '송도달빛공원', num: 2, name: 'Marie', role: 'Mgr', hireDate: '2023-01-09' },
  { code: '07', branch: '송도달빛공원', num: 3, name: 'Selena', role: 'Mgr', hireDate: '2023-01-30' },
  { code: '07', branch: '송도달빛공원', num: 4, name: 'Kassy', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '07', branch: '송도달빛공원', num: 5, name: 'Jake', role: 'Mgr', hireDate: '2025-09-22' },
  { code: '08', branch: '속초해변C', num: 1, name: 'Rian', role: 'HM', hireDate: '2024-09-23' },
  { code: '08', branch: '속초해변C', num: 2, name: 'Daisy', role: 'Mgr', hireDate: '2024-10-21' },
  { code: '08', branch: '속초해변C', num: 3, name: 'Judy', role: 'Mgr', hireDate: '2025-02-03' },
  { code: '10', branch: '속초등대해변', num: 1, name: 'Lucy', role: 'HM', hireDate: '2021-09-06' },
  { code: '10', branch: '속초등대해변', num: 2, name: 'Goose', role: 'Mgr', hireDate: '2022-04-18' },
  { code: '10', branch: '속초등대해변', num: 3, name: 'Nex', role: 'Mgr', hireDate: '2022-07-25' },
  { code: '10', branch: '속초등대해변', num: 4, name: 'Moana', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '10', branch: '속초등대해변', num: 5, name: 'Ara', role: 'Mgr', hireDate: '2024-04-01' },
  { code: '11', branch: '부산시청', num: 1, name: 'Jian', role: 'HM', hireDate: '2022-06-20' },
  { code: '11', branch: '부산시청', num: 2, name: 'Oscar', role: 'Mgr', hireDate: '2022-07-25' },
  { code: '11', branch: '부산시청', num: 3, name: 'Helena', role: 'Mgr', hireDate: '2023-01-30' },
  { code: '12', branch: '부산기장', num: 1, name: 'Sunny', role: 'HM', hireDate: '2023-06-05' },
  { code: '12', branch: '부산기장', num: 2, name: 'Aria', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '12', branch: '부산기장', num: 3, name: 'Labine', role: 'Mgr', hireDate: '2024-06-03' },
  { code: '12', branch: '부산기장', num: 4, name: 'Hwan', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '12', branch: '부산기장', num: 5, name: 'Teddy', role: 'Mgr', hireDate: '2025-09-22' },
  { code: '13', branch: '남포BIFF', num: 1, name: 'Lily', role: 'HM', hireDate: '2023-08-07' },
  { code: '13', branch: '남포BIFF', num: 2, name: 'Maisie', role: 'Mgr', hireDate: '2024-06-03' },
  { code: '13', branch: '남포BIFF', num: 3, name: 'Vivian', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '14', branch: '스타즈울산', num: 1, name: 'Hochi', role: 'HM', hireDate: '2023-08-07' },
  { code: '14', branch: '스타즈울산', num: 2, name: 'Woody', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '15', branch: '해운대역', num: 1, name: 'Milo', role: 'HM', hireDate: '2023-01-09' },
  { code: '15', branch: '해운대역', num: 2, name: 'Roxy', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '15', branch: '해운대역', num: 3, name: 'Finn', role: 'Mgr', hireDate: '2024-06-03' },
  { code: '15', branch: '해운대역', num: 4, name: 'Cleo', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '16', branch: '해운대패러그라프', num: 1, name: 'Tori', role: 'HM', hireDate: '2023-06-05' },
  { code: '16', branch: '해운대패러그라프', num: 2, name: 'Bella', role: 'Mgr', hireDate: '2024-04-01' },
  { code: '16', branch: '해운대패러그라프', num: 3, name: 'Hugo', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '17', branch: '부산송도해변', num: 1, name: 'River', role: 'HM', hireDate: '2024-04-01' },
  { code: '17', branch: '부산송도해변', num: 2, name: 'Yuna', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '17', branch: '부산송도해변', num: 3, name: 'Kai', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '20', branch: '속초해변', num: 1, name: 'Coco', role: 'HM', hireDate: '2022-06-20' },
  { code: '20', branch: '속초해변', num: 2, name: 'Remi', role: 'Mgr', hireDate: '2023-01-30' },
  { code: '20', branch: '속초해변', num: 3, name: 'Leon', role: 'Mgr', hireDate: '2024-06-03' },
  { code: '21', branch: '속초중앙', num: 1, name: 'Zoe', role: 'HM', hireDate: '2023-06-05' },
  { code: '21', branch: '속초중앙', num: 2, name: 'Ash', role: 'Mgr', hireDate: '2024-04-01' },
  { code: '21', branch: '속초중앙', num: 3, name: 'Ruby', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '22', branch: '속초자이엘라', num: 1, name: 'Nova', role: 'HM', hireDate: '2024-06-03' },
  { code: '22', branch: '속초자이엘라', num: 2, name: 'Sage', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '22', branch: '속초자이엘라', num: 3, name: 'Pearl', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '23', branch: '속초해변AB', num: 1, name: 'Quinn', role: 'HM', hireDate: '2024-04-01' },
  { code: '23', branch: '속초해변AB', num: 2, name: 'Sky', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '23', branch: '속초해변AB', num: 3, name: 'Ivy', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '24', branch: '낙산해변', num: 1, name: 'Jade', role: 'HM', hireDate: '2024-06-03' },
  { code: '24', branch: '낙산해변', num: 2, name: 'Opal', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '25', branch: '양양', num: 1, name: 'Storm', role: 'HM', hireDate: '2024-09-23' },
  { code: '25', branch: '양양', num: 2, name: 'Wren', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '26', branch: '동탄', num: 1, name: 'Felix', role: 'HM', hireDate: '2024-04-01' },
  { code: '26', branch: '동탄', num: 2, name: 'Luna', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '26', branch: '동탄', num: 3, name: 'Rex', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '27', branch: '시흥웨이브파크', num: 1, name: 'Atlas', role: 'HM', hireDate: '2024-06-03' },
  { code: '27', branch: '시흥웨이브파크', num: 2, name: 'Iris', role: 'Mgr', hireDate: '2024-09-23' },
  { code: '27', branch: '시흥웨이브파크', num: 3, name: 'Zen', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '28', branch: '당진터미널', num: 1, name: 'Echo', role: 'HM', hireDate: '2024-09-23' },
  { code: '28', branch: '당진터미널', num: 2, name: 'Mist', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '29', branch: '시흥거북섬', num: 1, name: 'Blaze', role: 'HM', hireDate: '2025-01-06' },
  { code: '29', branch: '시흥거북섬', num: 2, name: 'Dawn', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '30', branch: '인천차이나타운', num: 1, name: 'Cliff', role: 'HM', hireDate: '2025-01-06' },
  { code: '30', branch: '인천차이나타운', num: 2, name: 'Flora', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '31', branch: '제주남원', num: 1, name: 'Tidal', role: 'HM', hireDate: '2025-03-04' },
  { code: '31', branch: '제주남원', num: 2, name: 'Coral', role: 'Mgr', hireDate: '2025-09-22' },
  { code: '33', branch: '플라트 더 각 양양', num: 1, name: 'Wave', role: 'HM', hireDate: '2025-09-22' },
  { code: '33', branch: '플라트 더 각 양양', num: 2, name: 'Reef', role: 'Mgr', hireDate: '2026-01-05' },
];

// Day of week labels in Korean
const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

// April 2026 has 30 days, starts on Wednesday (수)
export function getApril2026Info() {
  const days: { date: number; dow: number; dowLabel: string }[] = [];
  for (let d = 1; d <= 30; d++) {
    const dateObj = new Date(2026, 3, d); // month is 0-indexed
    const dow = dateObj.getDay();
    days.push({ date: d, dow, dowLabel: dayLabels[dow] });
  }
  return days;
}

export function getMonthInfo(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: { date: number; dow: number; dowLabel: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dow = dateObj.getDay();
    days.push({ date: d, dow, dowLabel: dayLabels[dow] });
  }
  return days;
}

// Shift types for dropdown
export const shiftTypes: ShiftType[] = ['D6', 'D9', 'M', 'E', 'N', '#', 'D9/반', 'E/반', 'D6/반', ''];

// Generate realistic mock schedule data
// Pattern: HM usually works D9. Managers rotate D6/D9/E/M/N with # days off
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function generateScheduleData(
  branchCode: string,
  month: number = 4,
  year: number = 2026
): Record<string, CellData[]> {
  const branchEmployees = employees.filter(e => e.code === branchCode);
  const daysInMonth = new Date(year, month, 0).getDate();
  const schedule: Record<string, CellData[]> = {};

  branchEmployees.forEach((emp, empIdx) => {
    const rand = seededRandom(parseInt(branchCode) * 1000 + empIdx * 100 + month);
    const cells: CellData[] = [];

    // Create a basic rotation pattern
    const isHM = emp.role === 'HM' || emp.role === 'Lead';
    const shiftPool: ShiftType[] = isHM
      ? ['D9', 'D9', 'D9', 'D9', 'D9', '#', '#']
      : ['D6', 'D9', 'D9', 'E', 'M', 'N', '#'];

    let consecutiveWork = 0;

    for (let d = 0; d < daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d + 1);
      const dow = dateObj.getDay();
      const r = rand();

      let shift: ShiftType;

      if (consecutiveWork >= 5) {
        shift = '#';
        consecutiveWork = 0;
      } else if (r < 0.15) {
        shift = '#';
        consecutiveWork = 0;
      } else {
        const idx = Math.floor(rand() * shiftPool.length);
        shift = shiftPool[idx];
        if (shift === '#') {
          consecutiveWork = 0;
        } else {
          consecutiveWork++;
        }
      }

      // Occasional half shifts
      if (shift === 'D9' && rand() < 0.05) shift = 'D9/반';
      if (shift === 'E' && rand() < 0.05) shift = 'E/반';

      const hasLeaveRequest = shift === '#' && rand() < 0.3;
      const hasKakaoT = shift !== '#' && rand() < 0.15;

      cells.push({
        shift,
        leaveRequest: hasLeaveRequest,
        kakaoT: hasKakaoT,
        memo: rand() < 0.03 ? '조퇴' : '',
      });
    }

    schedule[`${emp.code}-${emp.num}`] = cells;
  });

  return schedule;
}

// Get shift display info
export function getShiftStyle(shift: ShiftType): { bg: string; text: string; label: string } {
  switch (shift) {
    case 'D6':
      return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'D6' };
    case 'D9':
      return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'D9' };
    case 'D9/반':
      return { bg: 'bg-blue-50', text: 'text-blue-600', label: 'D9반' };
    case 'M':
      return { bg: 'bg-violet-100', text: 'text-violet-800', label: 'M' };
    case 'E':
      return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'E' };
    case 'E/반':
      return { bg: 'bg-orange-50', text: 'text-orange-600', label: 'E반' };
    case 'N':
      return { bg: 'bg-teal-100', text: 'text-teal-800', label: 'N' };
    case '#':
      return { bg: 'bg-gray-100', text: 'text-gray-500', label: '#' };
    case 'D6/반':
      return { bg: 'bg-amber-50', text: 'text-amber-600', label: 'D6반' };
    default:
      return { bg: 'bg-white', text: 'text-gray-400', label: '' };
  }
}

export const shiftDescriptions: Record<string, string> = {
  'D6': 'Day6 (06:00~)',
  'D9': 'Day9 (09:00~)',
  'D9/반': 'Day9 반차',
  'M': 'Mid (12:00~)',
  'E': 'Eve (15:00~)',
  'E/반': 'Eve 반차',
  'N': 'Night (21:00~)',
  '#': '휴무',
  'D6/반': 'Day6 반차',
};
