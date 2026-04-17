export type SystemRole = 'admin' | 'org_admin' | 'hr' | 'manager' | 'employee';
export type Role = SystemRole | (string & {});
 
// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  fullName: string;
  role: Role;
  department?: string;
  avatar?: string;
  organizationId?: number | null;
}
 
// Keep these open to match existing route/menu checks across the app.
export type Action = string;
 
export type Subject = string;
 
// Permission interface with strict typing
export interface Permission {
  action: Action;
  subject: Subject;
}
 
// Helper type for permission inheritance
type InheritedPermissions = {
  [key in SystemRole]: SystemRole[];
};
 
// Define role inheritance
export const roleInheritance: InheritedPermissions = {
  admin: [], // Admin doesn't inherit - has all permissions
  org_admin: ['hr'],
  hr: ['employee'], // HR inherits employee permissions
  manager: ['employee'], // Manager inherits employee permissions
  employee: [], // Employee is base role
};
 
// Define base permissions for each role
export const rolePermissions: Record<SystemRole, Permission[]> = {
  admin: [
    { action: 'manage', subject: 'all' }
  ],
  org_admin: [
    { action: 'manage', subject: 'employees' },
    { action: 'read', subject: 'employees' },
    { action: 'manage', subject: 'projects' },
    { action: 'manage', subject: 'leave-balance' },
    { action: 'manage', subject: 'leave' },
    { action: 'approve', subject: 'leave' },
    { action: 'approve', subject: 'timesheet' },
    { action: 'approve', subject: 'expenses' },
    { action: 'manage', subject: 'settings' }
  ],
  hr: [
    { action: 'read', subject: 'employees' },
    { action: 'manage', subject: 'employees' },
    { action: 'manage', subject: 'projects' },
    { action: 'manage', subject: 'leave-balance' },
    { action: 'manage', subject: 'recruitment' },
    { action: 'manage', subject: 'leave' },
    { action: 'manage', subject: 'performance' },
    { action: 'approve', subject: 'leave' },
    { action: 'approve', subject: 'timesheet' },
    { action: 'approve', subject: 'expenses' }
  ],
  manager: [
    { action: 'read', subject: 'employees' },
    { action: 'manage', subject: 'recruitment' },
    { action: 'read', subject: 'performance' },
    { action: 'read', subject: 'analytics' },
    { action: 'approve', subject: 'timesheet' },
    { action: 'approve', subject: 'leave' },
    { action: 'approve', subject: 'expenses' }
  ],
  employee: [
    { action: 'read', subject: 'self' },
    { action: 'submit', subject: 'leave' },
    { action: 'submit', subject: 'timesheet' },
    { action: 'read', subject: 'learning' },
    { action: 'submit', subject: 'expenses' },
    { action: 'manage', subject: 'recruitment' },
    { action: 'manage', subject: 'performance' },
  ]
};
 
// Helper function to get all permissions for a role including inherited ones
export function resolvePermissionRole(role: string): SystemRole {
  const normalized = (role || '').toLowerCase() as SystemRole;
  if (Object.prototype.hasOwnProperty.call(rolePermissions, normalized)) {
    return normalized;
  }
  // Custom roles default to employee-level permissions unless extended later.
  return 'employee';
}

export function getAllPermissions(role: Role): Permission[] {
  const resolvedRole = resolvePermissionRole(role);
  const inheritedRoles = roleInheritance[resolvedRole];
  const inheritedPermissions = inheritedRoles.flatMap(r => rolePermissions[r]);
  return [...rolePermissions[resolvedRole], ...inheritedPermissions];
}
 
// Helper function to check if a permission implies another
export function doesPermissionImply(
  having: Permission,
  needed: Permission
): boolean {
  // 'manage' action implies all other actions
  if (having.action === 'manage') {
    // 'all' subject implies all other subjects
    if (having.subject === 'all') return true;
    // For same subject, 'manage' implies all actions
    return having.subject === needed.subject;
  }
 
  // For exact permission match
  return having.action === needed.action && having.subject === needed.subject;
}
 
// Helper function to check if user has specific permission
export function hasPermission(
  userPermissions: Permission[],
  action: Action,
  subject: Subject
): boolean {
  const needed: Permission = { action, subject };
  return userPermissions.some(having => doesPermissionImply(having, needed));
}