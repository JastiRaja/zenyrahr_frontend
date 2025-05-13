export type Role = 'admin' | 'hr' | 'manager' | 'employee';
 
// User interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  fullName: string;
  role: Role;
  department?: string;
  avatar?: string;
}
 
// Define all possible actions
export type Action = 'manage' | 'read' | 'create' | 'update' | 'delete' | 'approve' | 'submit';
 
// Define all possible subjects
export type Subject =
  | 'employee'
  | 'leave'
  | 'expense'
  | 'service-ticket'
  | 'recruitment'
  | 'timesheet'
  | 'travel'
  | 'project'
  | 'analytics'
  | 'performance'
  | 'settings';
 
// Permission interface with strict typing
export interface Permission {
  action: Action;
  subject: Subject;
}
 
// Helper type for permission inheritance
type InheritedPermissions = {
  [key in Role]: Role[];
};
 
// Define role inheritance
export const roleInheritance: InheritedPermissions = {
  admin: [], // Admin doesn't inherit - has all permissions
  hr: ['employee'], // HR inherits employee permissions
  manager: ['employee'], // Manager inherits employee permissions
  employee: [], // Employee is base role
};
 
// Define base permissions for each role
export const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    { action: 'manage', subject: 'all' }
  ],
  hr: [
    { action: 'read', subject: 'employees' },
    { action: 'manage', subject: 'employees' },
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
export function getAllPermissions(role: Role): Permission[] {
  const inheritedRoles = roleInheritance[role];
  const inheritedPermissions = inheritedRoles.flatMap(r => rolePermissions[r]);
  return [...rolePermissions[role], ...inheritedPermissions];
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