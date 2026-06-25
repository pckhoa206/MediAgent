import { useAuthStore } from '../store/useAuthStore';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Custom Fetch Client with Interceptors for attaching tokens and handling 401.
 */
export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, headers, ...customOptions } = options;

  let authHeaders: HeadersInit = {};

  if (requireAuth) {
    const { token } = useAuthStore.getState();
    if (token) {
      authHeaders = {
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const config: RequestInit = {
    ...customOptions,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  let response = await fetch(url, config);

  // Handle 401 Unauthorized (Token Expiration)
  if (response.status === 401 && requireAuth) {
    // Attempt to refresh token
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Credentials 'include' ensures HttpOnly cookies are sent
      credentials: 'include', 
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      const newToken = data.token;

      if (newToken) {
        // Update the global store
        useAuthStore.setState({ token: newToken });

        // Retry original request with new token
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(url, config);
      } else {
        // Failed to get a valid token from refresh, trigger logout
        useAuthStore.getState().logout();
        throw new Error('Session expired. Please log in again.');
      }
    } else {
      // Refresh token failed/expired
      useAuthStore.getState().logout();
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Parse response
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  // Determine response type
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  // Fallback for empty responses
  return (await response.text()) as any;
}
