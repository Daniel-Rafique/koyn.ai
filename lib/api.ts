import { APIResponse, PaginatedResponse } from './types'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// HTTP client with error handling
export class APIClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: any
      headers?: Record<string, string>
      searchParams?: Record<string, string>
      timeout?: number
    } = {}
  ): Promise<APIResponse<T>> {
    const { body, headers = {}, searchParams, timeout = 30000 } = options

    // Build URL with search params
    const url = new URL(`${this.baseURL}${path}`)
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers,
      },
      signal: AbortSignal.timeout(timeout),
    }

    if (body && method !== 'GET') {
      requestOptions.body = body instanceof FormData ? body : JSON.stringify(body)
      if (!(body instanceof FormData)) {
        requestOptions.headers = {
          ...requestOptions.headers,
          'Content-Type': 'application/json',
        }
      }
    }

    try {
      const response = await fetch(url.toString(), requestOptions)
      
      // Parse response
      let data: any
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new APIError(
          data?.message || data?.error || `HTTP ${response.status}`,
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new APIError('Request timeout', 408)
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError('Network error', 0)
      }
      
      throw new APIError('Unknown error occurred', 500, error)
    }
  }

  // HTTP methods
  async get<T>(path: string, searchParams?: Record<string, string>, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>('GET', path, { searchParams, headers })
  }

  async post<T>(path: string, body?: any, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>('POST', path, { body, headers })
  }

  async put<T>(path: string, body?: any, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>('PUT', path, { body, headers })
  }

  async patch<T>(path: string, body?: any, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>('PATCH', path, { body, headers })
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', path, { headers })
  }

  // Set authorization header
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Remove authorization header
  clearAuthToken() {
    delete this.defaultHeaders['Authorization']
  }
}

// Default API client instance
export const apiClient = new APIClient()

// Utility functions for common operations
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }
}

// Pagination helpers
export const buildPaginationParams = (page: number, pageSize: number) => ({
  page: page.toString(),
  limit: pageSize.toString(),
})

export const extractPaginationFromResponse = <T>(response: any): PaginatedResponse<T> => {
  return {
    data: response.data || [],
    totalCount: response.totalCount || 0,
    page: response.page || 1,
    pageSize: response.pageSize || 20,
    totalPages: response.totalPages || 1,
  }
}

// Response validation
export const validateResponse = <T>(response: APIResponse<T>): T => {
  if (!response.success) {
    throw new APIError(response.error || 'API request failed', 400, response)
  }
  
  if (response.data === undefined) {
    throw new APIError('No data in response', 500, response)
  }
  
  return response.data
}

// File upload helper
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<APIResponse<{ url: string; fileName: string }>> => {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          onProgress(progress)
        }
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new APIError('Invalid JSON response', xhr.status))
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText)
          reject(new APIError(errorResponse.message || 'Upload failed', xhr.status, errorResponse))
        } catch {
          reject(new APIError('Upload failed', xhr.status))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new APIError('Network error during upload', 0))
    })

    xhr.addEventListener('timeout', () => {
      reject(new APIError('Upload timeout', 408))
    })

    // Set timeout to 5 minutes for file uploads
    xhr.timeout = 5 * 60 * 1000

    // Add auth header if available
    const authHeader = apiClient['defaultHeaders']['Authorization']
    if (authHeader) {
      xhr.setRequestHeader('Authorization', authHeader)
    }

    xhr.open('POST', `${API_BASE_URL}${path}`)
    xhr.send(formData)
  })
}

// Retry logic for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError!
}

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private maxConcurrent = 5
  private currentRequests = 0

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.currentRequests >= this.maxConcurrent) {
      return
    }

    this.processing = true

    while (this.queue.length > 0 && this.currentRequests < this.maxConcurrent) {
      const request = this.queue.shift()
      if (request) {
        this.currentRequests++
        request().finally(() => {
          this.currentRequests--
          this.process()
        })
      }
    }

    this.processing = false
  }
}

export const requestQueue = new RequestQueue() 