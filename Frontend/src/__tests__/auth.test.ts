import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loginUser } from '@/lib/api';

describe('Authentication', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should handle login with valid credentials', async () => {
    const mockResponse = {
      user: { username: 'testuser', name: 'Test User', role: 'user' },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token'
    };

    // Mock the API call
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: () => Promise.resolve(mockResponse)
    });

    const result = await loginUser({ username: 'testuser', password: 'password' });
    expect(result).toEqual(mockResponse);
  });

  it('should handle login failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: {
        get: vi.fn().mockReturnValue('application/json')
      },
      json: () => Promise.resolve({ message: 'Invalid credentials' })
    });

    await expect(loginUser({ username: 'testuser', password: 'wrong' }))
      .rejects.toThrow('Invalid credentials');
  });
});
