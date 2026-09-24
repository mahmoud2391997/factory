export const ALL_PERMISSIONS = [
  'dashboard.view',
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.delete',
  'departments.view',
  'departments.create',
  'departments.edit',
  'departments.delete',
  'tasks.view',
  'tasks.create',
  'tasks.edit',
  'tasks.delete',
  'tasks.assign',
  'members.view',
  'members.invite',
  'members.remove',
  'members.assign_role',
  'roles.manage',
  'settings.manage',
  'team.delete',
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]

export const DEFAULT_ROLES: Record<string, { label: string; permissions: Permission[] }> = {
  ADMIN: { label: 'Administrator', permissions: [...ALL_PERMISSIONS] },
  MANAGER: {
    label: 'Manager',
    permissions: [
      'dashboard.view',
      'employees.view',
      'employees.create',
      'employees.edit',
      'departments.view',
      'departments.create',
      'departments.edit',
      'tasks.view',
      'tasks.create',
      'tasks.edit',
      'tasks.delete',
      'tasks.assign',
      'members.view',
      'roles.manage',
    ],
  },
  EMPLOYEE: {
    label: 'Employee',
    permissions: ['dashboard.view', 'tasks.view', 'employees.view', 'departments.view', 'members.view'],
  },
}

