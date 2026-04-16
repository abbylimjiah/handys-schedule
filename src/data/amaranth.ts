// Amaranth HR System Excel Export Utility
// Generates 교대근무엑셀업로드 format for Amaranth upload

import { ShiftType, Employee, CellData } from './mockData';

// Nickname → Real Name → Employee Code mapping (from 명단 sheet)
export const employeeRoster: Record<string, { realName: string; empCode: string }> = {
  'Min': { realName: '강민성', empCode: '26005' },
  'Vivian': { realName: '강예진', empCode: '24105' },
  'Lily': { realName: '강지혜', empCode: '24020' },
  'Eiden': { realName: '고경진', empCode: '21051' },
  'Marie': { realName: '고혜인', empCode: '23051' },
  'Maisie': { realName: '곽여진', empCode: '24065' },
  'Owen': { realName: '곽태범', empCode: '25017' },
  'Moana': { realName: '권바다', empCode: '24068' },
  'Jarry': { realName: '권상희', empCode: '22001' },
  'Aria': { realName: '김나영', empCode: '21064' },
  'Diana': { realName: '김다예', empCode: '22088' },
  'Woody': { realName: '김대욱', empCode: '21024' },
  'Goose': { realName: '김도연', empCode: '24031' },
  'Rian': { realName: '김무빈', empCode: '26037' },
  'Kassy': { realName: '김민주', empCode: '25036' },
  'Blair': { realName: '김서연', empCode: '23062' },
  'Yuni': { realName: '김서윤', empCode: '25003' },
  'Zoe': { realName: '김선진', empCode: '25069' },
  'Kai': { realName: '김수민', empCode: '26006' },
  'Sera': { realName: '김수빈', empCode: '26007' },
  'Beth': { realName: '김수연', empCode: '24092' },
  'Sophie': { realName: '김수연', empCode: '25091' },
  'Aki': { realName: '김슬아', empCode: '25070' },
  'Bono': { realName: '김예림', empCode: '25004' },
  'Caesar': { realName: '김완주', empCode: '23033' },
  'Yulia': { realName: '김유진', empCode: '25079' },
  'Asher': { realName: '김정래', empCode: '22115' },
  'Kali': { realName: '김정연', empCode: '24118' },
  'Summer': { realName: '김정옥', empCode: '21054' },
  'Max': { realName: '김지수', empCode: '24072' },
  'Jian': { realName: '김지안', empCode: '21089' },
  'Gem': { realName: '김지영', empCode: '22106' },
  'Sen': { realName: '김지은', empCode: '24096' },
  'Journey': { realName: '김지현', empCode: '22093' },
  'Luda': { realName: '김지현', empCode: '25109' },
  'Hwan': { realName: '김창환', empCode: '22079' },
  'Lyle': { realName: '김태성', empCode: '24111' },
  'PD': { realName: '김평두', empCode: '25080' },
  'Erin': { realName: '김혜민', empCode: '25071' },
  'Paul': { realName: '김효선', empCode: '23059' },
  'Ria': { realName: '류나리', empCode: '23020' },
  'Jeremy': { realName: '류원창', empCode: '24112' },
  'Hai': { realName: '마수빈', empCode: '24119' },
  'Windy': { realName: '문수진', empCode: '24120' },
  'Sele': { realName: '문효진', empCode: '25081' },
  'Carter': { realName: '박건우', empCode: '22073' },
  'Helena': { realName: '박소희', empCode: '26014' },
  'Elsa': { realName: '박아연', empCode: '22005' },
  'Stan': { realName: '박원진', empCode: '22065' },
  'Hailey': { realName: '박혜경', empCode: '24039' },
  'Leny': { realName: '서라현', empCode: '24048' },
  'Sasha': { realName: '서수현', empCode: '24113' },
  'Jamie': { realName: '서지우', empCode: '21088' },
  'Cody': { realName: '손정우', empCode: '25056' },
  'Sophia': { realName: '송수빈', empCode: '25019' },
  'Sky': { realName: '송하늘', empCode: '25093' },
  'Dia': { realName: '신가영', empCode: '25020' },
  'Hochi': { realName: '신민승', empCode: '25051' },
  'Shaco': { realName: '신성호', empCode: '22041' },
  'Leo': { realName: '신승엽', empCode: '21019' },
  'Jennie': { realName: '신유진', empCode: '25005' },
  'Liz': { realName: '신정민', empCode: '23035' },
  'Alexander': { realName: '안동효', empCode: '23003' },
  'Rumi': { realName: '양소정', empCode: '25094' },
  'Natalie': { realName: '양혜진', empCode: '25105' },
  'Hilda': { realName: '엄다희', empCode: '25047' },
  'Evie': { realName: '여은지', empCode: '25023' },
  'Dela': { realName: '오세정', empCode: '26028' },
  'Bruce': { realName: '오윤석', empCode: '23047' },
  'Bichon': { realName: '오준엽', empCode: '24073' },
  'Jake': { realName: '오지석', empCode: '26013' },
  'MJ': { realName: '우민주', empCode: '21001' },
  'Daniel': { realName: '우정현', empCode: '25008' },
  'Ina': { realName: '원한나', empCode: '22083' },
  'Hannah': { realName: '위한나', empCode: '22052' },
  'Derek': { realName: '유상혁', empCode: '24055' },
  'Ted': { realName: '윤수찬', empCode: '25006' },
  'Bard': { realName: '윤철민', empCode: '26012' },
  'Fay': { realName: '이민선', empCode: '25064' },
  'Bonny': { realName: '이보은', empCode: '22037' },
  'Liam': { realName: '이상민', empCode: '21050' },
  'Ivy': { realName: '이설매', empCode: '25106' },
  'Mac': { realName: '이성민', empCode: '22016' },
  'Claire': { realName: '이세아', empCode: '21020' },
  'Neko': { realName: '이소정', empCode: '26038' },
  'Luna': { realName: '이슬', empCode: '22025' },
  'Wonnie': { realName: '이원화', empCode: '24060' },
  'Jenna': { realName: '이유담', empCode: '24049' },
  'Yze': { realName: '이유정', empCode: '25074' },
  'Isaac': { realName: '이인우', empCode: '23036' },
  'Oscar': { realName: '이재진', empCode: '25083' },
  'Scarlett': { realName: '이정미', empCode: '23007' },
  'Jane': { realName: '이종미', empCode: '22035' },
  'Joyce': { realName: '이주혜', empCode: '25095' },
  'Devon': { realName: '이태희', empCode: '25104' },
  'Daphne': { realName: '이현지', empCode: '24082' },
  'Ara': { realName: '이혜정', empCode: '25075' },
  'Sani': { realName: '임솔이', empCode: '23060' },
  'Helen': { realName: '임영주', empCode: '23043' },
  'Nex': { realName: '임정현', empCode: '24057' },
  'Abby': { realName: '임지아', empCode: '21049' },
  'Mona': { realName: '임현아', empCode: '24036' },
  'Austin': { realName: '장민성', empCode: '23027' },
  'Khan': { realName: '장민혁', empCode: '25015' },
  'Edward': { realName: '장재성', empCode: '23009' },
  'Luan': { realName: '장지용', empCode: '26029' },
  'Sunny': { realName: '장채윤', empCode: '23029' },
  'Warren': { realName: '장한별', empCode: '22004' },
  'Solene': { realName: '전소하', empCode: '26008' },
  'Road': { realName: '정상길', empCode: '23056' },
  'Kyle': { realName: '정선우', empCode: '24025' },
  'Rareng': { realName: '정소희', empCode: '24021' },
  'Labine': { realName: '정인수', empCode: '22043' },
  'Teddy': { realName: '정지훈', empCode: '22062' },
  'Sammy': { realName: '정찬샘', empCode: '25096' },
  'Jin': { realName: '정해욱', empCode: '24076' },
  'Joseph': { realName: '정현우', empCode: '23021' },
  'Ivern': { realName: '조우희', empCode: '24041' },
  'Lucy': { realName: '조주영', empCode: '24017' },
  'Zico': { realName: '주성식', empCode: '26036' },
  'Judy': { realName: '최다희', empCode: '24011' },
  'Miles': { realName: '최영훈', empCode: '23022' },
  'Callia': { realName: '최재원', empCode: '22068' },
  'Nico': { realName: '최지승', empCode: '25065' },
  'Kylie': { realName: '최지원', empCode: '24109' },
  'Ella': { realName: '최지원', empCode: '25103' },
  'Kira': { realName: '한지현', empCode: '25043' },
  'Rei': { realName: '허정인', empCode: '26035' },
  'Hani': { realName: '홍소현', empCode: '25108' },
  'Nell': { realName: '황성민', empCode: '22072' },
  'Teri': { realName: '황지연', empCode: '23012' },
  'Aien': { realName: '황혜인', empCode: '23013' },
  'Eden': { realName: '', empCode: '' },
};

// Site shift code → Amaranth numeric code mapping
const shiftToAmaranth: Record<string, string> = {
  'D9': '001',
  'E': '002',
  '#': '004',
  'M': '005',
  'D6': '006',
  'N': '007',
  'D9/반': '001', 'E/반': '002', 'M/반': '005', 'D6/반': '006', 'N/반': '007',
  'D9/반반': '001', 'E/반반': '002', 'M/반반': '005', 'D6/반반': '006', 'N/반반': '007',
  '#(연차)': '004', '#(대체)': '004', '#(병가)': '004', '#(공가)': '004',
  '#(보건)': '004', '#(경조)': '004', '#(생일)': '004', '#(출산)': '004',
  '#(육아)': '004', '#(태아)': '004', '#(창립기념일)': '004',
  '파견': '001', 'D9/단': '001',
};

export function getAmaranthCode(shift: ShiftType | string): string {
  if (!shift) return '';
  return shiftToAmaranth[shift] || '';
}

const GROUP_CD = 'G100';
const GROUP_NM = '스케줄근무';
const PRTY_CD = '001';
const PRTY_NM = 'BQ 스케줄근무';

export function generateAmaranthCSV(
  branchCode: string,
  month: number,
  year: number,
  employees: Employee[],
  scheduleData: Record<string, CellData[]>
): string {
  const branchEmployees = employees.filter(e => e.code === branchCode && e.name.trim());
  const daysInMonth = new Date(year, month, 0).getDate();

  const headerLabels = ['근무분류코드', '근무분류명', '근무조코드', '근무조명', '사번', '사원명'];
  const headerFields = ['GROUP_CD', 'GROUP_NM', 'PRTY_CD', 'PRTY_NM', 'EMP_CD', 'EMP_NM'];
  const typeSpecs = ['text', 'text', 'text', 'text', 'text', 'text'];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    headerLabels.push(dayNames[dateObj.getDay()]);
    headerFields.push(`${year}${String(month).padStart(2, '0')}${String(d).padStart(2, '0')}`);
    typeSpecs.push('text');
  }

  const dataRows: string[][] = [];
  branchEmployees.forEach(emp => {
    const roster = employeeRoster[emp.name];
    if (!roster || !roster.empCode) return;
    const row = [GROUP_CD, GROUP_NM, PRTY_CD, PRTY_NM, roster.empCode, roster.realName];
    const cells = scheduleData[`${emp.code}-${emp.num}`] || [];
    for (let d = 0; d < daysInMonth; d++) {
      const cell = cells[d];
      row.push(cell && cell.shift ? getAmaranthCode(cell.shift as ShiftType) : '');
    }
    dataRows.push(row);
  });

  const lines = [
    headerLabels.join(','),
    headerFields.join(','),
    typeSpecs.join(','),
    ...dataRows.map(row => row.map(v => `"${v}"`).join(',')),
  ];
  return lines.join('\n');
}

export function downloadAmaranthExcel(
  branchCode: string,
  branchName: string,
  month: number,
  year: number,
  employees: Employee[],
  scheduleData: Record<string, CellData[]>
): void {
  const csv = generateAmaranthCSV(branchCode, month, year, employees, scheduleData);
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `교대근무엑셀업로드_${branchCode}_${branchName}_${year}${String(month).padStart(2, '0')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAllBranchesAmaranth(
  month: number,
  year: number,
  employees: Employee[],
  getAllScheduleData: (branchCode: string) => Record<string, CellData[]>
): void {
  const allEmployees = employees.filter(e => e.name.trim());
  const daysInMonth = new Date(year, month, 0).getDate();

  const headerLabels = ['근무분류코드', '근무분류명', '근무조코드', '근무조명', '사번', '사원명'];
  const headerFields = ['GROUP_CD', 'GROUP_NM', 'PRTY_CD', 'PRTY_NM', 'EMP_CD', 'EMP_NM'];
  const typeSpecs = ['text', 'text', 'text', 'text', 'text', 'text'];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    headerLabels.push(dayNames[dateObj.getDay()]);
    headerFields.push(`${year}${String(month).padStart(2, '0')}${String(d).padStart(2, '0')}`);
    typeSpecs.push('text');
  }

  const branchCodes = Array.from(new Set(allEmployees.map(e => e.code)));
  const dataRows: string[][] = [];

  branchCodes.forEach(code => {
    const scheduleData = getAllScheduleData(code);
    const branchEmps = allEmployees.filter(e => e.code === code);
    branchEmps.forEach(emp => {
      const roster = employeeRoster[emp.name];
      if (!roster || !roster.empCode) return;
      const row = [GROUP_CD, GROUP_NM, PRTY_CD, PRTY_NM, roster.empCode, roster.realName];
      const cells = scheduleData[`${emp.code}-${emp.num}`] || [];
      for (let d = 0; d < daysInMonth; d++) {
        const cell = cells[d];
        row.push(cell && cell.shift ? getAmaranthCode(cell.shift as ShiftType) : '');
      }
      dataRows.push(row);
    });
  });

  const lines = [
    headerLabels.join(','),
    headerFields.join(','),
    typeSpecs.join(','),
    ...dataRows.map(row => row.map(v => `"${v}"`).join(',')),
  ];

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `교대근무엑셀업로드_전체_${year}${String(month).padStart(2, '0')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
