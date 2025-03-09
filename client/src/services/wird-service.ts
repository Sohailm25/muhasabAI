import { WirdEntry, CLEARFrameworkData } from '../../shared/schema';

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

  async updateCLEARFramework(wirdId: string | number, clearFramework: CLEARFrameworkData): Promise<WirdEntry> {
    const response = await fetch(`/api/wirds/${wirdId}/clear-framework`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clearFramework }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update CLEAR framework');
    }
    
    return response.json();
  },

  async generateCLEARSummary(choices: CLEARFrameworkData): Promise<string> {
    const response = await fetch('/api/wirds/generate-clear-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ choices }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate CLEAR summary');
    }
    
    const data = await response.json();
    return data.summary;
  },
}; 