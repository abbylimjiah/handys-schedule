// Amaranth HR System Excel Export Utility
// Generates 교대근무엑셀업로드 format for Amaranth upload

import * as XLSX from 'xlsx-js-style';
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
  // 연차는 근무일로 처리 (Amaranth에서 별도 연차신청)
  '#(연차)': '001',
  // 나머지 휴무류는 휴무(004)로
  '#(대체)': '004', '#(병가)': '004', '#(공가)': '004',
  '#(보건)': '004', '#(경조)': '004', '#(생일)': '004', '#(출산)': '004',
  '#(육아)': '004', '#(태아)': '004', '#(창립기념일)': '004', '#(장기근속)': '004',
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

// 셀 종류별 색깔 결정
type CellTag = 'leave' | 'half' | 'quarter' | 'off' | 'work' | 'header' | null;

function getCellColor(tag: CellTag): { fg: string; bg: string } | null {
  switch (tag) {
    case 'leave':   return { fg: '9F1239', bg: 'FCE7F3' }; // 연차/연차상신: 핑크
    case 'half':    return { fg: '9A3412', bg: 'FED7AA' }; // 반차: 주황
    case 'quarter': return { fg: '92400E', bg: 'FEF3C7' }; // 반반차: 연노랑
    case 'off':     return { fg: '4B5563', bg: 'F3F4F6' }; // 휴무: 회색
    case 'header':  return { fg: '1F2937', bg: 'E5E7EB' }; // 헤더: 진회색
    default:        return null;
  }
}

// 셀 데이터 → 태그 (색깔 결정용)
function classifyCell(cell: CellData | undefined | null): CellTag {
  if (!cell || !cell.shift) return null;
  if (cell.leaveRequest) return 'leave';
  const s = String(cell.shift);
  if (s === '#(연차)') return 'leave';
  if (s.includes('/반반')) return 'quarter';
  if (s.includes('/반')) return 'half';
  if (s.startsWith('#')) return 'off';
  return 'work';
}

// 2D array → 스타일 정보 포함 워크시트
function buildSheet(
  rows: string[][],
  options?: {
    headerRows?: number; // 상단 몇 줄을 헤더로 (스타일 적용)
    leftCols?: number;   // 왼쪽 몇 컬럼은 메타정보 (헤더 스타일)
    cellTags?: (CellTag)[][]; // dataRows의 각 셀 태그 (없으면 생략)
  }
): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const headerRows = options?.headerRows ?? 0;
  const leftCols = options?.leftCols ?? 0;
  const cellTags = options?.cellTags;

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;
      cell.t = 's';
      cell.z = '@';
      if (cell.v !== undefined && cell.v !== null) cell.v = String(cell.v);

      // 스타일 적용
      const isHeader = R < headerRows || C < leftCols;
      let tag: CellTag = null;
      if (isHeader) {
        tag = 'header';
      } else if (cellTags) {
        const dataR = R - headerRows;
        const dataC = C - leftCols;
        tag = cellTags[dataR]?.[dataC] ?? null;
      }

      const colors = getCellColor(tag);
      cell.s = {
        font: {
          name: 'Arial',
          sz: isHeader ? 10 : 10,
          bold: isHeader,
          color: { rgb: colors?.fg || '111111' },
        },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
        border: {
          top:    { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left:   { style: 'thin', color: { rgb: 'D1D5DB' } },
          right:  { style: 'thin', color: { rgb: 'D1D5DB' } },
        },
        ...(colors && { fill: { fgColor: { rgb: colors.bg } } }),
      };
    }
  }

  // 컬럼 너비 (메타: 14, 날짜: 5)
  const colWidths = [];
  for (let C = 0; C <= range.e.c; C++) {
    colWidths.push({ wch: C < leftCols ? 12 : 5 });
  }
  ws['!cols'] = colWidths;

  return ws;
}

function arrayToWorkbook(rows: string[][], sheetName = 'Sheet1'): XLSX.WorkBook {
  const ws = buildSheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

// 텍스트 그대로 버전 (D9, E, M 등 라벨 그대로) — 단일 지점
export function downloadRawTextExcel(
  branchCode: string,
  branchName: string,
  month: number,
  year: number,
  employees: Employee[],
  scheduleData: Record<string, CellData[]>
): void {
  const branchEmployees = employees.filter(e => e.code === branchCode && e.name.trim());
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const headerTop = ['지점코드', '지점명', '사번', '사원명', '닉네임', '직책'];
  const headerBottom = ['', '', '', '', '', ''];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    headerTop.push(`${month}/${d}`);
    headerBottom.push(dayNames[dateObj.getDay()]);
  }

  const dataRows: string[][] = [];
  const cellTags: CellTag[][] = [];
  const META_COLS = 6;
  branchEmployees.forEach(emp => {
    const roster = employeeRoster[emp.name];
    const row = [
      emp.code,
      branchName,
      roster?.empCode || '',
      roster?.realName || '',
      emp.name,
      emp.role || '',
    ];
    const tagRow: CellTag[] = [null, null, null, null, null, null];
    const cells = scheduleData[`${emp.code}-${emp.num}`] || [];
    for (let d = 0; d < daysInMonth; d++) {
      const cell = cells[d];
      if (!cell || !cell.shift) { row.push(''); tagRow.push(null); continue; }
      let label: string = String(cell.shift);
      if (label.startsWith('#(') && label.endsWith(')')) {
        label = label.slice(2, -1);
      }
      if (cell.memo) label += `(${cell.memo})`;
      row.push(label);
      tagRow.push(classifyCell(cell));
    }
    dataRows.push(row);
    cellTags.push(tagRow);
  });

  const allRows = [headerTop, headerBottom, ...dataRows];
  const ws = buildSheet(allRows, { headerRows: 2, leftCols: META_COLS, cellTags });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, branchName || '스케줄');
  XLSX.writeFile(wb, `스케줄_${branchCode}_${branchName}_${year}${String(month).padStart(2, '0')}.xlsx`);
}

// 텍스트 그대로 버전 — 전체 지점 (지점별 시트 분리)
export function downloadAllRawTextExcel(
  month: number,
  year: number,
  employees: Employee[],
  getAllScheduleData: (branchCode: string) => Record<string, CellData[]>,
  branches: { code: string; name: string }[]
): void {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const wb = XLSX.utils.book_new();

  // 전체 통합 시트도 추가
  const allHeaderTop = ['지점코드', '지점명', '사번', '사원명', '닉네임', '직책'];
  const allHeaderBottom = ['', '', '', '', '', ''];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    allHeaderTop.push(`${month}/${d}`);
    allHeaderBottom.push(dayNames[dateObj.getDay()]);
  }
  const allDataRows: string[][] = [];
  const allCellTags: CellTag[][] = [];
  const META_COLS = 6;

  const branchCodes = Array.from(new Set(employees.filter(e => e.name.trim()).map(e => e.code)));

  branchCodes.forEach(code => {
    const branchName = branches.find(b => b.code === code)?.name || code;
    const branchEmps = employees.filter(e => e.code === code && e.name.trim());
    const scheduleData = getAllScheduleData(code);

    const headerTop = [...allHeaderTop];
    const headerBottom = [...allHeaderBottom];
    const dataRows: string[][] = [];
    const cellTags: CellTag[][] = [];

    branchEmps.forEach(emp => {
      const roster = employeeRoster[emp.name];
      const row = [
        emp.code,
        branchName,
        roster?.empCode || '',
        roster?.realName || '',
        emp.name,
        emp.role || '',
      ];
      const tagRow: CellTag[] = [null, null, null, null, null, null];
      const cells = scheduleData[`${emp.code}-${emp.num}`] || [];
      for (let d = 0; d < daysInMonth; d++) {
        const cell = cells[d];
        if (!cell || !cell.shift) { row.push(''); tagRow.push(null); continue; }
        let label: string = String(cell.shift);
        if (label.startsWith('#(') && label.endsWith(')')) {
          label = label.slice(2, -1);
        }
        if (cell.memo) label += `(${cell.memo})`;
        row.push(label);
        tagRow.push(classifyCell(cell));
      }
      dataRows.push(row);
      cellTags.push(tagRow);
      allDataRows.push(row);
      allCellTags.push(tagRow);
    });

    const sheetRows = [headerTop, headerBottom, ...dataRows];
    const ws = buildSheet(sheetRows, { headerRows: 2, leftCols: META_COLS, cellTags });
    const sheetName = `${code}_${branchName}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // 통합 시트를 맨 앞에 추가
  const allSheetRows = [allHeaderTop, allHeaderBottom, ...allDataRows];
  const allWs = buildSheet(allSheetRows, { headerRows: 2, leftCols: META_COLS, cellTags: allCellTags });
  wb.SheetNames.unshift('전체');
  wb.Sheets['전체'] = allWs;

  XLSX.writeFile(wb, `스케줄_전체_${year}${String(month).padStart(2, '0')}.xlsx`);
}

export function downloadAmaranthExcel(
  branchCode: string,
  branchName: string,
  month: number,
  year: number,
  employees: Employee[],
  scheduleData: Record<string, CellData[]>
): void {
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
  const cellTags: CellTag[][] = [];
  const META_COLS = 6;
  branchEmployees.forEach(emp => {
    const roster = employeeRoster[emp.name];
    if (!roster || !roster.empCode) return;
    const row = [GROUP_CD, GROUP_NM, PRTY_CD, PRTY_NM, roster.empCode, roster.realName];
    const tagRow: CellTag[] = [null, null, null, null, null, null];
    const cells = scheduleData[`${emp.code}-${emp.num}`] || [];
    for (let d = 0; d < daysInMonth; d++) {
      const cell = cells[d];
      row.push(cell && cell.shift ? getAmaranthCode(cell.shift as ShiftType) : '');
      tagRow.push(classifyCell(cell));
    }
    dataRows.push(row);
    cellTags.push(tagRow);
  });

  const allRows = [headerLabels, headerFields, typeSpecs, ...dataRows];
  const ws = buildSheet(allRows, { headerRows: 3, leftCols: META_COLS, cellTags });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '교대근무');
  XLSX.writeFile(wb, `교대근무엑셀업로드_${branchCode}_${branchName}_${year}${String(month).padStart(2, '0')}.xlsx`);
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

  const cellTags: CellTag[][] = [];
  const META_COLS = 6;

  branchCodes.forEach(code => {
    const scheduleData = getAllScheduleData(code);
    const branchEmps = allEmployees.filter(e => e.code === code);
    branchEmps.forEach(emp => {
      const roster = employeeRoster[emp.name];
      if (!roster || !roster.empCode) return;
      const row = [GROUP_CD, GROUP_NM, PRTY_CD, PRTY_NM, roster.empCode, roster.realName];
      const tagRow: CellTag[] = [null, null, null, null, null, null];
      const cells = scheduleData[`${emp.code}-${emp.num}`] || [];
      for (let d = 0; d < daysInMonth; d++) {
        const cell = cells[d];
        row.push(cell && cell.shift ? getAmaranthCode(cell.shift as ShiftType) : '');
        tagRow.push(classifyCell(cell));
      }
      dataRows.push(row);
      cellTags.push(tagRow);
    });
  });

  const allRows = [headerLabels, headerFields, typeSpecs, ...dataRows];
  const ws = buildSheet(allRows, { headerRows: 3, leftCols: META_COLS, cellTags });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '교대근무');
  XLSX.writeFile(wb, `교대근무엑셀업로드_전체_${year}${String(month).padStart(2, '0')}.xlsx`);
}
