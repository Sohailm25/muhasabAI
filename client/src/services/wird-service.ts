import { WirdEntry } from '../components/WirdEntryPopup';

export const wirdService = {
  async getWirdsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WirdEntry[]> {
    const response = await fetch(`/api/wirds?userId=${userId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch wird entries');
    }
    return response.json();
  },

  async createWird(data: Partial<WirdEntry>): Promise<WirdEntry> {
    const response = await fetch('/api/wirds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create wird entry');
    }
    return response.json();
  },

  async updateWird(id: string | number, data: Partial<WirdEntry>): Promise<WirdEntry> {
    const response = await fetch(`/api/wirds/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update wird entry');
    }
    return response.json();
  },

  async updatePractice(wirdId: string | number, practiceId: string, data: Partial<WirdEntry>): Promise<WirdEntry> {
    const response = await fetch(`/api/wirds/${wirdId}/practices/${practiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update practice');
    }
    return response.json();
  },
}; 