export interface RegisterPayload {
  username: string;
  password: string;
  role: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface DashboardData {
  metrics?: any[];
  evaluations?: any[];
  models?: any[];
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T | null;
  error?: string | null;
}

/**
 * Register a new user against the backend auth endpoint.
 * @param payload { username, password, role }
 * @returns ApiResponse with parsed JSON on success or error message.
 */
export async function registerUser(payload: RegisterPayload): Promise<ApiResponse> {
  try {
    const res = await fetch('http://127.0.0.1:8900/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) return { ok: false, status: res.status, data, error: typeof data === 'string' ? data : JSON.stringify(data) };
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.error('registerUser error', err);
    return { ok: false, status: 0, error: err?.message ?? 'Network error' };
  }
}

/**
 * Login user against backend auth endpoint. Expects { username, password } and returns token + user info.
 * @param payload { username, password }
 * @returns ApiResponse with token and user info on success or error message.
 */
export async function loginUser(payload: LoginPayload): Promise<ApiResponse> {
  try {
    const res = await fetch('http://127.0.0.1:8900/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) return { ok: false, status: res.status, data, error: typeof data === 'string' ? data : JSON.stringify(data) };
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.error('loginUser error', err);
    return { ok: false, status: 0, error: err?.message ?? 'Network error' };
  }
}


