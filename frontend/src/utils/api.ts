import toast from 'react-hot-toast';

/**
 * Helper to retrieve cookie by name from document.cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

/**
 * A production-grade wrapper around fetch that automatically handles:
 * 1. JSON stringifying for body payload
 * 2. CSRF Token extraction from document.cookie or localStorage and injection into X-CSRFToken header
 * 3. Automatic persistence of fresh CSRF tokens returned in API responses
 * 4. 401 Unauthorized session expiration interception
 * 5. 403 Permission Denied / CSRF Invalid error diagnostics
 * 6. Credentials inclusion for SessionAuthentication
 */
interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<any> {
  const headers = new Headers(options.headers || {});
  
  // Extract CSRF token from document.cookie (csrftoken) or fallback to localStorage
  const cookieCsrfToken = getCookie('csrftoken');
  const storageCsrfToken = typeof localStorage !== 'undefined' ? localStorage.getItem('csrf_token') : null;
  const csrfToken = cookieCsrfToken || storageCsrfToken;

  const method = (options.method || 'GET').toUpperCase();

  // Inject CSRF header for mutating HTTP requests
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers.set('X-CSRFToken', csrfToken);
    headers.set('X-CSRF-Token', csrfToken);
  }

  // Auto-set Content-Type for JSON if body is an object and not FormData
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',  // Always send session cookies
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('csrf_token');
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return { ok: false, error: 'Session expired. Please log in again.' };
    }

    if (response.status === 403) {
      toast.error('Permission Denied / CSRF Token Invalid');
    }

    // Try parsing json
    try {
      const data = await response.json();
      
      // Auto-stash fresh CSRF token if returned in payload
      if (data && data.csrf_token && typeof localStorage !== 'undefined') {
        localStorage.setItem('csrf_token', data.csrf_token);
      }

      return data;
    } catch (err) {
      // Not JSON
      if (!response.ok) {
        toast.error(`Request failed: ${response.statusText}`);
      }
      return { ok: response.ok, status: response.status };
    }
  } catch (err) {
    // Network error
    toast.error('Network error. Please check your connection.');
    return { ok: false, error: 'Network error' };
  }
}
