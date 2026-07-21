const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiError extends Error {
  status?: number;
}

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token is expired or unauthorized, clean local state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on the login page or landing page, redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.error || `Request failed with status ${response.status}`) as ApiError;
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err: any) {
    console.error(`API Fetch Error [${endpoint}]:`, err);
    throw err;
  }
};
