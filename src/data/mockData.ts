// Types
export type ShiftType =
  | 'D6' | 'D9' | 'M' | 'E' | 'N'
  | 'D6/반' | 'D9/반' | 'M/반' | 'E/반' | 'N/반'
  | 'D6/반반' | 'D9/반반' | 'M/반반' | 'E/반반' | 'N/반반'
  | '#' | '#(연차)' | '#(대체)' | '#(병가)' | '#(공가)' | '#(보건)'
  | '#(경조)' | '#(생일)' | '#(출산)' | '#(육아)' | '#(태아)' | '#(창립기념일)' | '#(장기근속)'
  | '파견' | 'D9/단'
  | '';

export type Role = 'Lead' | 'HM' | 'Mgr';

export interface Employee {
  code: string;
  branch: string;
  num: number;
  name: string;
  role: Role;
  hireDate: string;
  realName?: string;  // 실명 (한글 이름)
  empCode?: string;   // 사번 (예: 21049)
}

export interface CellData {
  shift: ShiftType;
  leaveRequest: boolean;
  kakaoT: boolean;
  memo: string;
}

export interface Branch {
  code: string;
  name: string;
  region: string;
  to?: number; // 할당 인원 (고정값)
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

// 2026 공휴일
export const holidays2026: Holiday[] = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-02-16', name: '설 연휴' },
  { date: '2026-02-17', name: '설날' },
  { date: '2026-02-18', name: '설 연휴' },
  { date: '2026-03-01', name: '3.1절' },
  { date: '2026-03-02', name: '대체공휴일' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-24', name: '석가탄신일' },
  { date: '2026-05-25', name: '대체공휴일' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-08-17', name: '대체공휴일' },
  { date: '2026-09-24', name: '추석 연휴' },
  { date: '2026-09-25', name: '추석' },
  { date: '2026-09-26', name: '추석 연휴' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-05', name: '대체공휴일' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '크리스마스' },
];

// Check if a date is a holiday
export function getHoliday(year: number, month: number, day: number): Holiday | undefined {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return holidays2026.find(h => h.date === dateStr);
}

// All 29 branches grouped by region (tab names from BQ_2026_Schedule_NEW)
export const branches: Branch[] = [
  // 본사
  { code: '01', name: 'HQ', region: '본사', to: 5 },
  // 서울
  { code: '04', name: '명동', region: '서울', to: 4 },
  { code: '15', name: '강남 시그니티', region: '서울', to: 5 },
  { code: '17', name: '서울 익선', region: '서울', to: 4 },
  { code: '21', name: '강남 로이움', region: '서울', to: 5 },
  // 수도권
  { code: '07', name: '송도달빛공원', region: '수도권', to: 5 },
  { code: '18', name: '시흥 웨이브파크', region: '수도권', to: 9 },
  { code: '24', name: '인천 차이나타운', region: '수도권', to: 6 },
  { code: '26', name: '시흥 거북섬', region: '수도권', to: 7 },
  { code: '31', name: '호텔 동탄', region: '수도권', to: 4 },
  // 충청
  { code: '22', name: '당진터미널', region: '충청', to: 5 },
  // 부산
  { code: '02', name: '서면', region: '부산', to: 6 },
  { code: '06', name: '부산역', region: '부산', to: 5 },
  { code: '11', name: '부산시청', region: '부산', to: 4 },
  { code: '12', name: '부산기장', region: '부산', to: 5 },
  { code: '13', name: '남포 BIFF', region: '부산', to: 4 },
  { code: '19', name: '부산송도해변', region: '부산', to: 5 },
  { code: '25', name: '해운대 패러그라프', region: '부산', to: 5 },
  { code: '27', name: '해운대역', region: '부산', to: 5 },
  // 울산
  { code: '14', name: '울산 스타즈', region: '울산', to: 8 },
  // 제주
  { code: '05', name: '제주공항', region: '제주', to: 4 },
  // 속초/강원
  { code: '08', name: '속초해변C', region: '속초/강원', to: 4 },
  { code: '10', name: '속초등대해변', region: '속초/강원', to: 5 },
  { code: '23', name: '속초해변AB', region: '속초/강원', to: 5 },
  { code: '28', name: '낙산해변', region: '속초/강원', to: 4 },
  { code: '29', name: '속초해변', region: '속초/강원', to: 6 },
  { code: '30', name: '속초중앙', region: '속초/강원', to: 7 },
  { code: '32', name: '속초 자이엘라', region: '속초/강원', to: 6 },
  { code: '33', name: '플라트 더 각 양양', region: '속초/강원', to: 6 },
  // 가평
  { code: '34', name: '플라트 위드 오버더마운틴', region: '가평', to: 5 },
];

export const regions = ['본사', '서울', '수도권', '충청', '부산', '울산', '제주', '속초/강원', '가평'];

// Full employee roster (from 핸디즈 tab - 2026-04 latest)
export const defaultEmployees: Employee[] = [
  // 01 HQ
  { code: '01', branch: 'HQ', num: 1, name: 'Abby', role: 'Lead', hireDate: '2021-09-01' },
  { code: '01', branch: 'HQ', num: 2, name: 'Nell', role: 'Lead', hireDate: '2022-06-27' },
  { code: '01', branch: 'HQ', num: 3, name: 'Diana', role: 'Lead', hireDate: '2022-08-08' },
  { code: '01', branch: 'HQ', num: 4, name: 'Miles', role: 'Lead', hireDate: '2023-05-15' },
  { code: '01', branch: 'HQ', num: 5, name: '', role: 'Lead', hireDate: '' },
  // 02 서면
  { code: '02', branch: '서면', num: 1, name: 'Leo', role: 'HM', hireDate: '2021-05-24' },
  { code: '02', branch: '서면', num: 2, name: 'Alexander', role: 'Mgr', hireDate: '2023-01-09' },
  { code: '02', branch: '서면', num: 3, name: 'Bonny', role: 'Mgr', hireDate: '2022-04-18' },
  { code: '02', branch: '서면', num: 4, name: 'Hwan', role: 'Mgr', hireDate: '2022-07-25' },
  { code: '02', branch: '서면', num: 5, name: 'Teri', role: 'Mgr', hireDate: '2023-01-30' },
  { code: '02', branch: '서면', num: 6, name: 'Sen', role: 'Mgr', hireDate: '2024-09-23' },
  // 04 명동
  { code: '04', branch: '명동', num: 1, name: 'Road', role: 'HM', hireDate: '2023-09-18' },
  { code: '04', branch: '명동', num: 2, name: 'Jennie', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '04', branch: '명동', num: 3, name: 'Sophia', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '04', branch: '명동', num: 4, name: 'Joyce', role: 'Mgr', hireDate: '2025-10-27' },
  // 05 제주공항
  { code: '05', branch: '제주공항', num: 1, name: 'Eiden', role: 'HM', hireDate: '2021-09-06' },
  { code: '05', branch: '제주공항', num: 2, name: 'Callia', role: 'Mgr', hireDate: '2022-06-20' },
  { code: '05', branch: '제주공항', num: 3, name: 'Liz', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '05', branch: '제주공항', num: 4, name: 'Neko', role: 'Mgr', hireDate: '2026-03-16' },
  // 06 부산역
  { code: '06', branch: '부산역', num: 1, name: 'Stan', role: 'HM', hireDate: '2022-06-20' },
  { code: '06', branch: '부산역', num: 2, name: 'Journey', role: 'Mgr', hireDate: '2022-08-22' },
  { code: '06', branch: '부산역', num: 3, name: 'Caesar', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '06', branch: '부산역', num: 4, name: 'Wonnie', role: 'Mgr', hireDate: '2024-06-17' },
  { code: '06', branch: '부산역', num: 5, name: 'Jake', role: 'Mgr', hireDate: '2026-01-19' },
  // 07 송도달빛공원
  { code: '07', branch: '송도달빛공원', num: 1, name: 'Kyle', role: 'HM', hireDate: '2024-03-04' },
  { code: '07', branch: '송도달빛공원', num: 2, name: 'Marie', role: 'Mgr', hireDate: '2023-09-18' },
  { code: '07', branch: '송도달빛공원', num: 3, name: 'Erin', role: 'Mgr', hireDate: '2024-03-04' },
  { code: '07', branch: '송도달빛공원', num: 4, name: 'Kira', role: 'Mgr', hireDate: '2025-04-21' },
  { code: '07', branch: '송도달빛공원', num: 5, name: 'Rian', role: 'Mgr', hireDate: '2026-03-16' },
  // 08 속초해변C
  { code: '08', branch: '속초해변C', num: 1, name: '', role: 'HM', hireDate: '' },
  { code: '08', branch: '속초해변C', num: 2, name: 'Paul', role: 'Mgr', hireDate: '2023-10-04' },
  { code: '08', branch: '속초해변C', num: 3, name: 'Kylie', role: 'Mgr', hireDate: '2024-11-04' },
  { code: '08', branch: '속초해변C', num: 4, name: 'Sasha', role: 'Mgr', hireDate: '2024-11-18' },
  // 10 속초등대해변
  { code: '10', branch: '속초등대해변', num: 1, name: 'Lucy', role: 'HM', hireDate: '2024-02-05' },
  { code: '10', branch: '속초등대해변', num: 2, name: 'Moana', role: 'Mgr', hireDate: '2024-07-15' },
  { code: '10', branch: '속초등대해변', num: 3, name: 'Sky', role: 'Mgr', hireDate: '2025-10-27' },
  { code: '10', branch: '속초등대해변', num: 4, name: '', role: 'Mgr', hireDate: '' },
  { code: '10', branch: '속초등대해변', num: 5, name: '', role: 'Mgr', hireDate: '' },
  // 11 부산시청
  { code: '11', branch: '부산시청', num: 1, name: 'Sunny', role: 'HM', hireDate: '2023-07-24' },
  { code: '11', branch: '부산시청', num: 2, name: 'Rareng', role: 'Mgr', hireDate: '2024-02-19' },
  { code: '11', branch: '부산시청', num: 3, name: 'Bichon', role: 'Mgr', hireDate: '2024-08-05' },
  { code: '11', branch: '부산시청', num: 4, name: 'Zoe', role: 'Mgr', hireDate: '2025-08-04' },
  // 12 부산기장
  { code: '12', branch: '부산기장', num: 1, name: 'Teddy', role: 'HM', hireDate: '2022-06-13' },
  { code: '12', branch: '부산기장', num: 2, name: 'Hochi', role: 'Mgr', hireDate: '2025-05-26' },
  { code: '12', branch: '부산기장', num: 3, name: 'Sophie', role: 'Mgr', hireDate: '2025-10-27' },
  { code: '12', branch: '부산기장', num: 4, name: 'Hani', role: 'Mgr', hireDate: '2025-12-01' },
  { code: '12', branch: '부산기장', num: 5, name: 'Ivy', role: 'Mgr', hireDate: '2025-12-01' },
  // 13 남포 BIFF
  { code: '13', branch: '남포 BIFF', num: 1, name: 'Woody', role: 'HM', hireDate: '2021-06-23' },
  { code: '13', branch: '남포 BIFF', num: 2, name: 'Aria', role: 'Mgr', hireDate: '2021-10-18' },
  { code: '13', branch: '남포 BIFF', num: 3, name: 'Labine', role: 'Mgr', hireDate: '2022-05-09' },
  { code: '13', branch: '남포 BIFF', num: 4, name: 'Hannah', role: 'Mgr', hireDate: '2022-05-30' },
  // 14 울산 스타즈
  { code: '14', branch: '울산 스타즈', num: 1, name: 'Scarlett', role: 'HM', hireDate: '2023-01-16' },
  { code: '14', branch: '울산 스타즈', num: 2, name: 'Edward', role: 'Mgr', hireDate: '2023-01-16' },
  { code: '14', branch: '울산 스타즈', num: 3, name: 'Jenna', role: 'Mgr', hireDate: '2024-05-20' },
  { code: '14', branch: '울산 스타즈', num: 4, name: 'Ted', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '14', branch: '울산 스타즈', num: 5, name: 'Yuni', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '14', branch: '울산 스타즈', num: 6, name: 'Daniel', role: 'Mgr', hireDate: '2025-01-20' },
  { code: '14', branch: '울산 스타즈', num: 7, name: 'Dia', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '14', branch: '울산 스타즈', num: 8, name: 'Rei', role: 'Mgr', hireDate: '2026-03-16' },
  // 15 강남 시그니티
  { code: '15', branch: '강남 시그니티', num: 1, name: 'Ivern', role: 'HM', hireDate: '2024-05-07' },
  { code: '15', branch: '강남 시그니티', num: 2, name: 'Isaac', role: 'Mgr', hireDate: '2023-08-07' },
  { code: '15', branch: '강남 시그니티', num: 3, name: 'Hailey', role: 'Mgr', hireDate: '2024-05-07' },
  { code: '15', branch: '강남 시그니티', num: 4, name: 'Devon', role: 'Mgr', hireDate: '2025-11-17' },
  { code: '15', branch: '강남 시그니티', num: 5, name: 'Bard', role: 'Mgr', hireDate: '2026-01-19' },
  // 17 서울 익선
  { code: '17', branch: '서울 익선', num: 1, name: 'Jamie', role: 'HM', hireDate: '2021-12-20' },
  { code: '17', branch: '서울 익선', num: 2, name: 'Marin', role: 'Mgr', hireDate: '2023-09-18' },
  { code: '17', branch: '서울 익선', num: 3, name: 'Blair', role: 'Mgr', hireDate: '2023-11-06' },
  { code: '17', branch: '서울 익선', num: 4, name: 'Luan', role: 'Mgr', hireDate: '2026-02-23' },
  // 18 시흥 웨이브파크
  { code: '18', branch: '시흥 웨이브파크', num: 1, name: 'Mac', role: 'HM', hireDate: '2022-02-14' },
  { code: '18', branch: '시흥 웨이브파크', num: 2, name: 'Khan', role: 'Mgr', hireDate: '2025-02-17' },
  { code: '18', branch: '시흥 웨이브파크', num: 3, name: 'PD', role: 'Mgr', hireDate: '2025-09-15' },
  { code: '18', branch: '시흥 웨이브파크', num: 4, name: 'Sele', role: 'Mgr', hireDate: '2025-09-15' },
  { code: '18', branch: '시흥 웨이브파크', num: 5, name: 'Rumi', role: 'Mgr', hireDate: '2025-10-27' },
  { code: '18', branch: '시흥 웨이브파크', num: 6, name: 'Natalie', role: 'Mgr', hireDate: '2025-12-01' },
  { code: '18', branch: '시흥 웨이브파크', num: 7, name: 'Eden', role: 'Mgr', hireDate: '2026-04-06' },
  { code: '18', branch: '시흥 웨이브파크', num: 8, name: '', role: 'Mgr', hireDate: '' },
  { code: '18', branch: '시흥 웨이브파크', num: 9, name: '', role: 'Mgr', hireDate: '' },
  // 19 부산송도해변
  { code: '19', branch: '부산송도해변', num: 1, name: 'Claire', role: 'HM', hireDate: '2021-05-24' },
  { code: '19', branch: '부산송도해변', num: 2, name: 'Jane', role: 'Mgr', hireDate: '2022-04-11' },
  { code: '19', branch: '부산송도해변', num: 3, name: 'Aki', role: 'Mgr', hireDate: '2025-08-04' },
  { code: '19', branch: '부산송도해변', num: 4, name: 'Ella', role: 'Mgr', hireDate: '2025-11-03' },
  { code: '19', branch: '부산송도해변', num: 5, name: 'Luda', role: 'Mgr', hireDate: '2025-12-15' },
  // 21 강남 로이움
  { code: '21', branch: '강남 로이움', num: 1, name: 'Carter', role: 'HM', hireDate: '2023-05-15' },
  { code: '21', branch: '강남 로이움', num: 2, name: 'Jeremy', role: 'Mgr', hireDate: '2024-11-18' },
  { code: '21', branch: '강남 로이움', num: 3, name: 'Cody', role: 'Mgr', hireDate: '2025-06-23' },
  { code: '21', branch: '강남 로이움', num: 4, name: 'Oscar', role: 'Mgr', hireDate: '2025-09-15' },
  { code: '21', branch: '강남 로이움', num: 5, name: 'Min', role: 'Mgr', hireDate: '2026-01-05' },
  // 22 당진터미널
  { code: '22', branch: '당진터미널', num: 1, name: 'Joseph', role: 'HM', hireDate: '2023-05-15' },
  { code: '22', branch: '당진터미널', num: 2, name: 'Luna', role: 'Mgr', hireDate: '2022-03-16' },
  { code: '22', branch: '당진터미널', num: 3, name: 'Ria', role: 'Mgr', hireDate: '2023-05-15' },
  { code: '22', branch: '당진터미널', num: 4, name: 'Goose', role: 'Mgr', hireDate: '2024-04-15' },
  { code: '22', branch: '당진터미널', num: 5, name: 'Maisie', role: 'Mgr', hireDate: '2024-07-01' },
  // 23 속초해변AB
  { code: '23', branch: '속초해변AB', num: 1, name: 'Liam', role: 'HM', hireDate: '2021-09-03' },
  { code: '23', branch: '속초해변AB', num: 2, name: 'Shaco', role: 'Mgr', hireDate: '2022-05-09' },
  { code: '23', branch: '속초해변AB', num: 3, name: 'Kali', role: 'Mgr', hireDate: '2024-12-16' },
  { code: '23', branch: '속초해변AB', num: 4, name: 'Sammy', role: 'Mgr', hireDate: '2025-10-27' },
  { code: '23', branch: '속초해변AB', num: 5, name: '', role: 'Mgr', hireDate: '' },
  // 24 인천 차이나타운
  { code: '24', branch: '인천 차이나타운', num: 1, name: 'Warren', role: 'HM', hireDate: '2022-01-03' },
  { code: '24', branch: '인천 차이나타운', num: 2, name: 'Lyle', role: 'Mgr', hireDate: '2024-11-18' },
  { code: '24', branch: '인천 차이나타운', num: 3, name: 'Suzy', role: 'Mgr', hireDate: '2025-04-21' },
  { code: '24', branch: '인천 차이나타운', num: 4, name: 'Solene', role: 'Mgr', hireDate: '2026-01-05' },
  { code: '24', branch: '인천 차이나타운', num: 5, name: 'Dela', role: 'Mgr', hireDate: '2026-02-23' },
  { code: '24', branch: '인천 차이나타운', num: 6, name: 'Clover', role: 'Mgr', hireDate: '2026-04-06' },
  // 25 해운대 패러그라프
  { code: '25', branch: '해운대 패러그라프', num: 1, name: 'Summer', role: 'HM', hireDate: '2021-09-11' },
  { code: '25', branch: '해운대 패러그라프', num: 2, name: 'Lily', role: 'Mgr', hireDate: '2024-02-19' },
  { code: '25', branch: '해운대 패러그라프', num: 3, name: 'Mona', role: 'Mgr', hireDate: '2024-04-15' },
  { code: '25', branch: '해운대 패러그라프', num: 4, name: 'Leny', role: 'Mgr', hireDate: '2024-05-20' },
  { code: '25', branch: '해운대 패러그라프', num: 5, name: 'Vivian', role: 'Mgr', hireDate: '2024-11-04' },
  // 26 시흥 거북섬
  { code: '26', branch: '시흥 거북섬', num: 1, name: 'Helen', role: 'HM', hireDate: '2023-08-21' },
  { code: '26', branch: '시흥 거북섬', num: 2, name: 'Aien', role: 'Mgr', hireDate: '2023-01-30' },
  { code: '26', branch: '시흥 거북섬', num: 3, name: 'Austin', role: 'Mgr', hireDate: '2023-07-03' },
  { code: '26', branch: '시흥 거북섬', num: 4, name: 'Max', role: 'Mgr', hireDate: '2024-08-05' },
  { code: '26', branch: '시흥 거북섬', num: 5, name: 'Daphne', role: 'Mgr', hireDate: '2024-08-19' },
  { code: '26', branch: '시흥 거북섬', num: 6, name: 'Kassy', role: 'Mgr', hireDate: '2025-04-07' },
  { code: '26', branch: '시흥 거북섬', num: 7, name: 'Ari', role: 'Mgr', hireDate: '2026-04-06' },
  // 27 해운대역
  { code: '27', branch: '해운대역', num: 1, name: 'MJ', role: 'HM', hireDate: '2021-01-01' },
  { code: '27', branch: '해운대역', num: 2, name: 'Bruce', role: 'Mgr', hireDate: '2023-09-04' },
  { code: '27', branch: '해운대역', num: 3, name: 'Beth', role: 'Mgr', hireDate: '2024-09-09' },
  { code: '27', branch: '해운대역', num: 4, name: 'Evie', role: 'Mgr', hireDate: '2025-04-07' },
  { code: '27', branch: '해운대역', num: 5, name: 'Ara', role: 'Mgr', hireDate: '2025-08-04' },
  // 28 낙산해변
  { code: '28', branch: '낙산해변', num: 1, name: 'Gem', role: 'HM', hireDate: '2022-10-31' },
  { code: '28', branch: '낙산해변', num: 2, name: 'Nex', role: 'Mgr', hireDate: '2024-06-03' },
  { code: '28', branch: '낙산해변', num: 3, name: 'Yulia', role: 'Mgr', hireDate: '2025-09-15' },
  { code: '28', branch: '낙산해변', num: 4, name: '', role: 'Mgr', hireDate: '' },
  // 29 속초해변
  { code: '29', branch: '속초해변', num: 1, name: 'Ina', role: 'HM', hireDate: '2022-07-25' },
  { code: '29', branch: '속초해변', num: 2, name: 'Asher', role: 'Mgr', hireDate: '2022-11-14' },
  { code: '29', branch: '속초해변', num: 3, name: 'Sani', role: 'Mgr', hireDate: '2023-10-16' },
  { code: '29', branch: '속초해변', num: 4, name: 'Hilda', role: 'Mgr', hireDate: '2025-05-12' },
  { code: '29', branch: '속초해변', num: 5, name: '', role: 'Mgr', hireDate: '' },
  { code: '29', branch: '속초해변', num: 6, name: '', role: 'Mgr', hireDate: '' },
  // 30 속초중앙
  { code: '30', branch: '속초중앙', num: 1, name: 'Jarry', role: 'HM', hireDate: '2022-01-03' },
  { code: '30', branch: '속초중앙', num: 2, name: 'Elsa', role: 'Mgr', hireDate: '2022-01-17' },
  { code: '30', branch: '속초중앙', num: 3, name: 'Bono', role: 'Mgr', hireDate: '2025-01-06' },
  { code: '30', branch: '속초중앙', num: 4, name: 'Nico', role: 'Mgr', hireDate: '2025-07-07' },
  { code: '30', branch: '속초중앙', num: 5, name: '', role: 'Mgr', hireDate: '' },
  { code: '30', branch: '속초중앙', num: 6, name: '', role: 'Mgr', hireDate: '' },
  { code: '30', branch: '속초중앙', num: 7, name: '', role: 'Mgr', hireDate: '' },
  // 31 호텔 동탄
  { code: '31', branch: '호텔 동탄', num: 1, name: 'Jian', role: 'HM', hireDate: '2021-12-22' },
  { code: '31', branch: '호텔 동탄', num: 2, name: 'Jin', role: 'Mgr', hireDate: '2024-08-05' },
  { code: '31', branch: '호텔 동탄', num: 3, name: 'Fay', role: 'Mgr', hireDate: '2025-07-07' },
  { code: '31', branch: '호텔 동탄', num: 4, name: 'Helena', role: 'Mgr', hireDate: '2026-01-19' },
  // 32 속초 자이엘라
  { code: '32', branch: '속초 자이엘라', num: 1, name: '', role: 'HM', hireDate: '' },
  { code: '32', branch: '속초 자이엘라', num: 2, name: 'Kai', role: 'Mgr', hireDate: '2026-01-05' },
  { code: '32', branch: '속초 자이엘라', num: 3, name: 'Sera', role: 'Mgr', hireDate: '2026-01-05' },
  { code: '32', branch: '속초 자이엘라', num: 4, name: 'Zico', role: 'Mgr', hireDate: '2026-03-16' },
  { code: '32', branch: '속초 자이엘라', num: 5, name: '', role: 'Mgr', hireDate: '' },
  { code: '32', branch: '속초 자이엘라', num: 6, name: '', role: 'Mgr', hireDate: '' },
  // 33 플라트 더 각 양양
  { code: '33', branch: '플라트 더 각 양양', num: 1, name: 'Judy', role: 'HM', hireDate: '2024-01-22' },
  { code: '33', branch: '플라트 더 각 양양', num: 2, name: 'Derek', role: 'Mgr', hireDate: '2024-06-03' },
  { code: '33', branch: '플라트 더 각 양양', num: 3, name: 'Windy', role: 'Mgr', hireDate: '2024-12-16' },
  { code: '33', branch: '플라트 더 각 양양', num: 4, name: 'Hai', role: 'Mgr', hireDate: '2024-12-16' },
  { code: '33', branch: '플라트 더 각 양양', num: 5, name: 'Owen', role: 'Mgr', hireDate: '2025-03-04' },
  { code: '33', branch: '플라트 더 각 양양', num: 6, name: 'Yze', role: 'Mgr', hireDate: '2025-08-04' },
  // 34 플라트 위드 오버더마운틴
  { code: '34', branch: '플라트 위드 오버더마운틴', num: 1, name: 'Adene', role: 'HM', hireDate: '2026-04-16' },
  { code: '34', branch: '플라트 위드 오버더마운틴', num: 2, name: '', role: 'Mgr', hireDate: '' },
  { code: '34', branch: '플라트 위드 오버더마운틴', num: 3, name: '', role: 'Mgr', hireDate: '' },
  { code: '34', branch: '플라트 위드 오버더마운틴', num: 4, name: '', role: 'Mgr', hireDate: '' },
  { code: '34', branch: '플라트 위드 오버더마운틴', num: 5, name: '', role: 'Mgr', hireDate: '' },
];

// localStorage key for employee data
const EMPLOYEES_STORAGE_KEY = 'handys-schedule-employees';

// Get employees (from localStorage if available, otherwise default)
export function getEmployees(): Employee[] {
  if (typeof window === 'undefined') return defaultEmployees;
  try {
    const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultEmployees;
}

// Save employees to localStorage
export function saveEmployees(employees: Employee[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
}

// Reset employees to default
export function resetEmployees(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
}

// Day of week labels in Korean
const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

export function getMonthInfo(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: { date: number; dow: number; dowLabel: string; holiday?: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dow = dateObj.getDay();
    const holiday = getHoliday(year, month, d);
    days.push({ date: d, dow, dowLabel: dayLabels[dow], holiday: holiday?.name });
  }
  return days;
}

// Shift type categories for the selector UI
export const shiftCategories = {
  regular: [
    { code: 'D6' as ShiftType, label: 'D6', desc: '06:00~' },
    { code: 'D9' as ShiftType, label: 'D9', desc: '09:00~' },
    { code: 'M' as ShiftType, label: 'M', desc: '중간근무' },
    { code: 'E' as ShiftType, label: 'E', desc: '14:00~' },
    { code: 'N' as ShiftType, label: 'N', desc: '18:00~' },
  ],
  half: [
    { code: 'D6/반' as ShiftType, label: 'D6/반', desc: 'D6 반차' },
    { code: 'D9/반' as ShiftType, label: 'D9/반', desc: 'D9 반차' },
    { code: 'M/반' as ShiftType, label: 'M/반', desc: 'M 반차' },
    { code: 'E/반' as ShiftType, label: 'E/반', desc: 'E 반차' },
    { code: 'N/반' as ShiftType, label: 'N/반', desc: 'N 반차' },
  ],
  quarter: [
    { code: 'D6/반반' as ShiftType, label: 'D6/반반', desc: 'D6 반반차' },
    { code: 'D9/반반' as ShiftType, label: 'D9/반반', desc: 'D9 반반차' },
    { code: 'M/반반' as ShiftType, label: 'M/반반', desc: 'M 반반차' },
    { code: 'E/반반' as ShiftType, label: 'E/반반', desc: 'E 반반차' },
    { code: 'N/반반' as ShiftType, label: 'N/반반', desc: 'N 반반차' },
  ],
  off: [
    { code: '#' as ShiftType, label: '#', desc: '휴무' },
    { code: '#(연차)' as ShiftType, label: '연차', desc: '연차' },
    { code: '#(대체)' as ShiftType, label: '대체', desc: '대체휴무' },
    { code: '#(병가)' as ShiftType, label: '병가', desc: '병가' },
    { code: '#(공가)' as ShiftType, label: '공가', desc: '예비군 등' },
    { code: '#(보건)' as ShiftType, label: '보건', desc: '보건휴가' },
    { code: '#(경조)' as ShiftType, label: '경조', desc: '경조사' },
    { code: '#(생일)' as ShiftType, label: '생일', desc: '생일 유급휴가' },
    { code: '#(출산)' as ShiftType, label: '출산', desc: '출산휴가' },
    { code: '#(육아)' as ShiftType, label: '육아', desc: '육아휴직' },
    { code: '#(태아)' as ShiftType, label: '태아', desc: '태아 건강검진' },
    { code: '#(창립기념일)' as ShiftType, label: '창립', desc: '창립기념일 연차' },
    { code: '#(장기근속)' as ShiftType, label: '장기', desc: '장기근속 휴가' },
  ],
  special: [
    { code: '파견' as ShiftType, label: '파견', desc: '파견/출장' },
    { code: 'D9/단' as ShiftType, label: 'D9/단', desc: '임산부 단축근무' },
  ],
};

// All shift types flat list
export const shiftTypes: ShiftType[] = [
  ...shiftCategories.regular.map(s => s.code),
  ...shiftCategories.half.map(s => s.code),
  ...shiftCategories.quarter.map(s => s.code),
  ...shiftCategories.off.map(s => s.code),
  ...shiftCategories.special.map(s => s.code),
  '' as ShiftType,
];

// Generate realistic mock schedule data
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
  year: number = 2026,
  employeeList?: Employee[]
): Record<string, CellData[]> {
  const allEmployees = employeeList || getEmployees();
  const branchEmployees = allEmployees.filter(e => e.code === branchCode);
  const daysInMonth = new Date(year, month, 0).getDate();
  const schedule: Record<string, CellData[]> = {};

  // Empty schedule — no mock data, staff will fill in themselves
  branchEmployees.forEach((emp) => {
    const cells: CellData[] = [];
    for (let d = 0; d < daysInMonth; d++) {
      cells.push({ shift: '' as ShiftType, leaveRequest: false, kakaoT: false, memo: '' });
    }
    schedule[`${emp.code}-${emp.num}`] = cells;
  });

  return schedule;
}

// Get shift display info
export function getShiftStyle(shift: ShiftType): { bg: string; text: string; label: string } {
  // Regular shifts
  if (shift === 'D6') return { bg: 'bg-yellow-200', text: 'text-yellow-900', label: 'D6' };
  if (shift === 'D9') return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'D9' };
  if (shift === 'M') return { bg: 'bg-violet-100', text: 'text-violet-800', label: 'M' };
  if (shift === 'E') return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'E' };
  if (shift === 'N') return { bg: 'bg-indigo-200', text: 'text-indigo-900', label: 'N' };

  // Half shifts (반차)
  if (shift === 'D6/반') return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'D6반' };
  if (shift === 'D9/반') return { bg: 'bg-blue-50', text: 'text-blue-600', label: 'D9반' };
  if (shift === 'M/반') return { bg: 'bg-violet-50', text: 'text-violet-600', label: 'M반' };
  if (shift === 'E/반') return { bg: 'bg-orange-50', text: 'text-orange-600', label: 'E반' };
  if (shift === 'N/반') return { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'N반' };

  // Quarter shifts (반반차)
  if (shift === 'D6/반반') return { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'D6반반' };
  if (shift === 'D9/반반') return { bg: 'bg-blue-50/60', text: 'text-blue-500', label: 'D9반반' };
  if (shift === 'M/반반') return { bg: 'bg-violet-50/60', text: 'text-violet-500', label: 'M반반' };
  if (shift === 'E/반반') return { bg: 'bg-orange-50/60', text: 'text-orange-500', label: 'E반반' };
  if (shift === 'N/반반') return { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'N반반' };

  // Off types
  if (shift === '#') return { bg: 'bg-gray-100', text: 'text-gray-500', label: '#' };
  if (shift === '#(연차)') return { bg: 'bg-pink-100', text: 'text-pink-700', label: '연차' };
  if (shift === '#(대체)') return { bg: 'bg-slate-200', text: 'text-slate-600', label: '대체' };
  if (shift === '#(병가)') return { bg: 'bg-red-100', text: 'text-red-600', label: '병가' };
  if (shift === '#(공가)') return { bg: 'bg-sky-100', text: 'text-sky-700', label: '공가' };
  if (shift === '#(보건)') return { bg: 'bg-lime-100', text: 'text-lime-700', label: '보건' };
  if (shift === '#(경조)') return { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '경조' };
  if (shift === '#(생일)') return { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', label: '생일' };
  if (shift === '#(출산)') return { bg: 'bg-rose-100', text: 'text-rose-700', label: '출산' };
  if (shift === '#(육아)') return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '육아' };
  if (shift === '#(태아)') return { bg: 'bg-cyan-100', text: 'text-cyan-700', label: '태아' };
  if (shift === '#(창립기념일)') return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '창립' };
  if (shift === '#(장기근속)') return { bg: 'bg-purple-100', text: 'text-purple-700', label: '장기' };

  // Special
  if (shift === '파견') return { bg: 'bg-stone-200', text: 'text-stone-700', label: '파견' };
  if (shift === 'D9/단') return { bg: 'bg-blue-50', text: 'text-blue-500', label: 'D9단' };

  return { bg: 'bg-white', text: 'text-gray-400', label: '' };
}

export const shiftDescriptions: Record<string, string> = {
  'D6': 'Day6 (06:00~)',
  'D9': 'Day9 (09:00~)',
  'M': 'Mid 중간근무',
  'E': 'Eve (14:00~)',
  'N': 'Night (18:00~)',
  'D6/반': 'D6 반차(전/후)',
  'D9/반': 'D9 반차(전/후)',
  'M/반': 'M 반차(전/후)',
  'E/반': 'E 반차(전/후)',
  'N/반': 'N 반차(전/후)',
  'D6/반반': 'D6 반반차(전/후)',
  'D9/반반': 'D9 반반차(전/후)',
  'M/반반': 'M 반반차(전/후)',
  'E/반반': 'E 반반차(전/후)',
  'N/반반': 'N 반반차(전/후)',
  '#': '휴무',
  '#(연차)': '연차',
  '#(대체)': '대체휴무',
  '#(병가)': '병가',
  '#(공가)': '예비군 참석(8시간) 등',
  '#(보건)': '보건휴가',
  '#(경조)': '경조사',
  '#(생일)': '생일 유급 휴가',
  '#(출산)': '출산휴가',
  '#(육아)': '육아휴직',
  '#(태아)': '임산부 태아 건강검진',
  '#(창립기념일)': '창립기념일 연차',
  '#(장기근속)': '장기근속 휴가',
  '파견': '파견/출장',
  'D9/단': '임산부 단축근무',
};
