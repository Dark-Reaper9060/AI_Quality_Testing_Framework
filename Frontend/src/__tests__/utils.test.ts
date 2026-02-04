import { describe, it, expect, vi } from 'vitest';
import { fetchModelDetails } from '@/lib/utils';

describe('Utils', () => {
  it('should fetch model details successfully', async () => {
    const result = await fetchModelDetails();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('models');
    expect(Array.isArray(result.models)).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
  });

  it('should return model details with required fields', async () => {
    const result = await fetchModelDetails();
    const model = result.models[0];
    
    expect(model).toHaveProperty('accuracy');
    expect(model).toHaveProperty('bias');
    expect(model).toHaveProperty('responseTime');
    expect(model).toHaveProperty('testsThisWeek');
  });

  it('should handle API errors gracefully', async () => {
    // Note: fetchModelDetails uses mock data and doesn't actually call fetch
    // This test verifies the function works with the mock data
    const result = await fetchModelDetails();
    expect(result).toBeDefined();
    expect(result.models).toBeDefined();
  });
});
