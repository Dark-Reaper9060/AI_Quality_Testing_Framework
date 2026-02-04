import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fetch model details from the backend API using native fetch.
 * Returns parsed JSON or null on error.
 */
export async function fetchModelDetails() {
  try {
    // For now, return mock data since backend API doesn't exist
    const mockData = {
      models: [
        { id: 1, name: 'GPT-4', accuracy: 95, bias: 12, spd: 0.045, testsThisWeek: 2, responseTime: 180 },
        { id: 2, name: 'Claude-3', accuracy: 93, bias: 8, spd: 0.038, testsThisWeek: 2, responseTime: 165 },
        { id: 3, name: 'Gemini-Pro', accuracy: 91, bias: 15, spd: 0.052, testsThisWeek: 2, responseTime: 195 }
      ]
    };
    return mockData;
  } catch (error) {
    console.error('Failed to fetch model details:', error);
    return null;
  }
}
