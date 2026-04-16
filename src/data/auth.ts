// 3-Tier Permission System: Master / Editor(지점별) / Viewer

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

export function loginByEmail(email: string, name: string): CurrentUser | null {
  if (!isValidCompanyEmail(email)) return null;
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

// Edit period check (20th~24th)
export function isEditPeriod(): boolean {
  const day = new Date().getDate();
  return day >= 20 && day <= 24;
}

// Permissions (지점별)
export function canEditSchedule(user: CurrentUser | null, branchCode?: string): boolean {
  if (!user) return false;
  if (user.role === 'master') return true;
  if (user.role === 'editor') {
    const settings = getAdminSettings();
    const periodOk = isEditPeriod() || settings.editPeriodOverride;
    if (!periodOk) return false;
    if (!branchCode) return true; // 지점 미지정이면 일반 편집 가능 여부만
    return isEditorForBranch(user.name, branchCode);
  }
  return false;
}

export function canEditLeaveRequest(user: CurrentUser | null): boolean {
  return user?.role === 'master';
}

export function canDeleteSchedule(user: CurrentUser | null, branchCode?: string): boolean {
  if (!user) return false;
  if (user.role === 'master') return true;
  if (user.role === 'editor') {
    const settings = getAdminSettings();
    const periodOk = isEditPeriod() || settings.editPeriodOverride;
    if (!periodOk) return false;
    if (!branchCode) return true;
    return isEditorForBranch(user.name, branchCode);
  }
  return false;
}

export function canManageEmployees(user: CurrentUser | null): boolean {
  return user?.role === 'master';
}
