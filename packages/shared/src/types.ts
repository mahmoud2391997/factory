export type ApiSuccess<T> = {
  success: true
  data: T
  message: string
}

export type ApiError = {
  success: false
  message: string
  errors?: Array<{ path?: string; message: string; code?: string }>
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

