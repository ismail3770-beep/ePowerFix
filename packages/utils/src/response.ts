export function success<T>(data: T, message?: string) {
  return { success: true as const, data, message: message || 'OK' }
}

export function error(message: string, statusCode = 400) {
  return { success: false as const, error: message, statusCode }
}
