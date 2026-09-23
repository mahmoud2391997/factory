export type AuthRole = {
  key: string
  nameAr: string
}

export type AuthUser = {
  id: string
  email: string
  fullName: string
  isActive: boolean
  roles: AuthRole[]
  permissions: string[]
  mustChangePassword?: boolean
}

export type AuthApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  code?: string
  errors?: Array<{ path?: string; message: string }>
}
