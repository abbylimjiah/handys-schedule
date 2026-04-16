// 3-Tier Permission System: Master / Editor / Viewer

export type UserRole = 'master' | 'editor' | 'viewer';

export interface CurrentUser {
  name: string;
  role: UserRole;
}

export interface AdminSettings {
  editPeriodOverride: boolean;
  grantedEditors: string[];
}

const MASTER_PASSWORD = 'handys2026';
const AUTH_KEY = 'handys-auth';
const ADMIN_KEY = 'handys-admin-settings';

// Admin settings
export function getAdminSettings(): AdminSettings {
  if (typeof window === 'undefined') return { editPeriodOverride: false, grantedEditors: [] };
  try {
    const saved = localStorage.getItem(ADMIN_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { editPeriodOverride: false, grantedEditors: [] };
}

export function saveAdminSettings(settings: AdminSettings) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(settings));
}

// Login
export function loginMaster(password: string): CurrentUser | null {
  if (password !== MASTER_PASSWORD) return null;
  const user: CurrentUser = { name: 'Abby', role: 'master' };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function loginByName(name: string): CurrentUser {
  const settings = getAdminSettings();
  const role: UserRole = settings.grantedEditors.includes(name) ? 'editor' : 'viewer';
  const user: CurrentUser = { name, role };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      const user = JSON.parse(saved) as CurrentUser;
      // Re-check editor status
      if (user.role === 'editor' || user.role === 'viewer') {
        const settings = getAdminSettings();
        user.role = settings.grantedEditors.includes(user.name) ? 'editor' : 'viewer';
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

// Permissions
export function canEditSchedule(user: CurrentUser | null): boolean {
  if (!user) return false;
  if (user.role === 'master') return true;
  if (user.role === 'editor') {
    const settings = getAdminSettings();
    return isEditPeriod() || settings.editPeriodOverride;
  }
  return false;
}

export function canEditLeaveRequest(user: CurrentUser | null): boolean {
  return user?.role === 'master';
}

// Editor도 삭제 가능
export function canDeleteSchedule(user: CurrentUser | null): boolean {
  if (!user) return false;
  if (user.role === 'master') return true;
  if (user.role === 'editor') {
    const settings = getAdminSettings();
    return isEditPeriod() || settings.editPeriodOverride;
  }
  return false;
}

export function canManageEmployees(user: CurrentUser | null): boolean {
  return user?.role === 'master';
}
