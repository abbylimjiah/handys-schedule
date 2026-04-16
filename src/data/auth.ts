// 3-Tier Permission System: Master / Editor(지점별) / Viewer
// + HM 자동 편집: 편집기간 중 HM은 본인 소속 지점만 편집 가능

import { Employee, getEmployees } from './mockData';

export type UserRole = 'master' | 'editor' | 'viewer';

export interface CurrentUser {
  name: string;
  email: string;
  role: UserRole;
}

// 에디터 권한: 이름 → 허용 지점코드 배열 ('*' = 전체 지점)
export interface EditorPermission {
  name: string;
  branches: string[]; // ['02', '06'] 또는 ['*'] (전체)
}

export interface AdminSettings {
  editPeriodOverride: boolean;
  grantedEditors: string[]; // 하위호환 (기존 데이터)
  editorPermissions: EditorPermission[];
}

const DEFAULT_MASTER_PASSWORD = 'handys2026';
const AUTH_KEY = 'handys-auth';
const ADMIN_KEY = 'handys-admin-settings';
const PASSWORD_KEY = 'handys-master-password';

// Master password
export function getMasterPassword(): string {
  if (typeof window === 'undefined') return DEFAULT_MASTER_PASSWORD;
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_MASTER_PASSWORD;
}

export function setMasterPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.length < 4) return false;
  localStorage.setItem(PASSWORD_KEY, newPassword);
  return true;
}

// Admin settings (하위호환: 기존 grantedEditors → editorPermissions 마이그레이션)
export function getAdminSettings(): AdminSettings {
  if (typeof window === 'undefined') return { editPeriodOverride: false, grantedEditors: [], editorPermissions: [] };
  try {
    const saved = localStorage.getItem(ADMIN_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 마이그레이션: 기존 grantedEditors만 있고 editorPermissions가 없으면 변환
      if (!parsed.editorPermissions && parsed.grantedEditors?.length > 0) {
        parsed.editorPermissions = parsed.grantedEditors.map((name: string) => ({
          name,
          branches: ['*'],
        }));
      }
      if (!parsed.editorPermissions) parsed.editorPermissions = [];
      return parsed;
    }
  } catch {}
  return { editPeriodOverride: false, grantedEditors: [], editorPermissions: [] };
}

export function saveAdminSettings(settings: AdminSettings) {
  // grantedEditors도 같이 업데이트 (하위호환)
  settings.grantedEditors = settings.editorPermissions.map(ep => ep.name);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(settings));
}

// 에디터 권한 조회
export function getEditorPermission(name: string): EditorPermission | null {
  const settings = getAdminSettings();
  return settings.editorPermissions.find(ep => ep.name === name) || null;
}

export function isEditorForBranch(name: string, branchCode: string): boolean {
  const perm = getEditorPermission(name);
  if (!perm) return false;
  return perm.branches.includes('*') || perm.branches.includes(branchCode);
}

// 회사 이메일 검증
const COMPANY_DOMAIN = 'handys.co.kr';

export function isValidCompanyEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  return lower.endsWith(`@${COMPANY_DOMAIN}`);
}

// Login
export function loginMaster(password: string): CurrentUser | null {
  if (password !== getMasterPassword()) return null;
  const existing = getCurrentUser();
  const user: CurrentUser = { name: 'Abby', email: existing?.email || 'abby@handys.co.kr', role: 'master' };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function loginByEmail(email: string, name: string): CurrentUser | null | 'blocked' {
  if (!isValidCompanyEmail(email)) return null;
  // 차단 확인
  if (isUserBlocked(name)) return 'blocked';
  const settings = getAdminSettings();
  const isEditor = settings.editorPermissions.some(ep => ep.name === name);
  const role: UserRole = isEditor ? 'editor' : 'viewer';
  const user: CurrentUser = { name, email: email.toLowerCase().trim(), role };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      const user = JSON.parse(saved) as CurrentUser;
      if (user.role === 'editor' || user.role === 'viewer') {
        const settings = getAdminSettings();
        const isEditor = settings.editorPermissions.some(ep => ep.name === user.name);
        user.role = isEditor ? 'editor' : 'viewer';
      }
      return user;
    }
  } catch {}
  return null;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

// 편집기간 예외 설정 (특정 월만 날짜 변경)
interface EditPeriodException {
  year: number;
  editMonth: number;    // 편집이 일어나는 월 (현재 달력 기준)
  startDay: number;
  endDay: number;
  targetMonth: number;  // 편집 대상 스케줄 월
}

const EDIT_PERIOD_EXCEPTIONS: EditPeriodException[] = [
  // 2026년 5월 스케줄: 4월 17~24일에 편집
  { year: 2026, editMonth: 4, startDay: 17, endDay: 24, targetMonth: 5 },
];

// Edit period check (기본: 20~24일, 예외 적용)
export function isEditPeriod(): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 예외 기간 확인
  for (const ex of EDIT_PERIOD_EXCEPTIONS) {
    if (year === ex.year && month === ex.editMonth && day >= ex.startDay && day <= ex.endDay) {
      return true;
    }
  }

  // 기본: 매월 20~24일
  return day >= 20 && day <= 24;
}

// HM 자동 편집: 로그인한 사용자가 해당 지점의 HM인지 확인
export function getHMBranch(name: string, employees?: Employee[]): string | null {
  const emps = employees || getEmployees();
  const hm = emps.find(e => e.name === name && e.role === 'HM');
  return hm ? hm.code : null;
}

export function isHMForBranch(userName: string, branchCode: string, employees?: Employee[]): boolean {
  const hmBranch = getHMBranch(userName, employees);
  return hmBranch === branchCode;
}

// Permissions (지점별 + HM 자동편집)
export function canEditSchedule(user: CurrentUser | null, branchCode?: string, employees?: Employee[]): boolean {
  if (!user) return false;
  if (user.role === 'master') return true;

  const settings = getAdminSettings();
  const periodOk = isEditPeriod() || settings.editPeriodOverride;

  // 에디터: 편집기간 중 지정된 지점 편집 가능
  if (user.role === 'editor' && periodOk) {
    if (!branchCode) return true;
    return isEditorForBranch(user.name, branchCode);
  }

  // HM 자동 편집: 편집기간 중 본인 소속 지점만 편집 가능
  if (periodOk && branchCode) {
    if (isHMForBranch(user.name, branchCode, employees)) return true;
  }

  return false;
}

export function canEditLeaveRequest(user: CurrentUser | null): boolean {
  return user?.role === 'master';
}

export function canDeleteSchedule(user: CurrentUser | null, branchCode?: string, employees?: Employee[]): boolean {
  if (!user) return false;
  if (user.role === 'master') return true;

  const settings = getAdminSettings();
  const periodOk = isEditPeriod() || settings.editPeriodOverride;

  if (user.role === 'editor' && periodOk) {
    if (!branchCode) return true;
    return isEditorForBranch(user.name, branchCode);
  }

  // HM 자동 삭제: 편집기간 중 본인 소속 지점만
  if (periodOk && branchCode) {
    if (isHMForBranch(user.name, branchCode, employees)) return true;
  }

  return false;
}

export function canManageEmployees(user: CurrentUser | null): boolean {
  return user?.role === 'master';
}

// ─── User Management (사용자 관리) ───
export type ManagedRole = 'branch' | 'viewer' | 'master';

export interface ManagedUser {
  englishName: string;
  koreanName: string;
  email: string;
  role: ManagedRole;        // branch = 지점 에디터, viewer, master
  branches: string[];       // role='branch'일 때 접근 가능 지점 코드
  homeBranch: string;       // 소속 지점 코드
  homeBranchName: string;   // 소속 지점 이름
  status: 'active' | 'blocked';
}

const MANAGED_USERS_KEY = 'handys-managed-users';

export function getManagedUsers(): ManagedUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(MANAGED_USERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveManagedUsers(users: ManagedUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(users));
  // AdminSettings와 동기화 (editorPermissions)
  syncManagedUsersToSettings(users);
}

function syncManagedUsersToSettings(users: ManagedUser[]) {
  const settings = getAdminSettings();
  settings.editorPermissions = users
    .filter(u => u.role === 'branch' && u.status === 'active')
    .map(u => ({ name: u.englishName, branches: u.branches }));
  settings.grantedEditors = settings.editorPermissions.map(ep => ep.name);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(settings));
}

// 직원 목록 + amaranth roster에서 ManagedUser 초기화
export function initManagedUsers(
  employees: Employee[],
  roster: Record<string, { realName: string; empCode: string }>
): ManagedUser[] {
  const existing = getManagedUsers();
  if (existing.length > 0) return existing; // 이미 초기화됨

  const seen = new Set<string>();
  const users: ManagedUser[] = [];

  employees.forEach(emp => {
    if (!emp.name.trim() || seen.has(emp.name)) return;
    seen.add(emp.name);
    const info = roster[emp.name];
    users.push({
      englishName: emp.name,
      koreanName: info?.realName || '',
      email: '',
      role: 'viewer',
      branches: [emp.code],
      homeBranch: emp.code,
      homeBranchName: emp.branch,
      status: 'active',
    });
  });

  saveManagedUsers(users);
  return users;
}

// 차단된 사용자 확인
export function isUserBlocked(name: string): boolean {
  const users = getManagedUsers();
  const user = users.find(u => u.englishName === name);
  return user?.status === 'blocked';
}

// 사용자 역할 확인 (ManagedUsers 기준)
export function getManagedUserRole(name: string): ManagedRole {
  const users = getManagedUsers();
  const user = users.find(u => u.englishName === name);
  return user?.role || 'viewer';
}
