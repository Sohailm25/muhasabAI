import { WirdPractice } from '@/types';

/**
 * Interface for CLEAR framework suggestions
 */
export interface CLEARSuggestions {
  cue: string[];
  lowFriction: string[];
  expandable: string[];
  adaptable: string[];
  rewardLinked: string[];
}

/**
 * Service for handling CLEAR framework operations
 * This includes fetching suggestions and updating CLEAR framework data
 */
export class CLEARService {
  private apiBase: string;

  constructor() {
    this.apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
  }

  /**
   * Fetch CLEAR framework suggestions for a practice
   */
  async getCLEARSuggestions(practice: WirdPractice): Promise<CLEARSuggestions> {
    try {
      const response = await fetch(`${this.apiBase}/generate/clear-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ practice }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching CLEAR suggestions:', errorData);
        throw new Error(errorData.error || 'Failed to fetch CLEAR suggestions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getCLEARSuggestions:', error);
      // Return default suggestions if API call fails
      return {
        cue: ['Link to a specific time or context', 'Associate with an existing habit'],
        lowFriction: ['Make it easy to start', 'Reduce initial effort needed'],
        expandable: ['Start small, scale up when able', 'Have levels of commitment'],
        adaptable: ['Have backup plans', 'Adjust to different scenarios'],
        rewardLinked: ['Connect to immediate benefits', 'Link to spiritual growth']
      };
    }
  }

  /**
   * Update CLEAR framework data for a practice
   */
  async updateCLEARFramework(
    wirdId: number,
    practiceId: string,
    clearData: {
      cue: string;
      lowFriction: string;
      expandable: string;
      adaptable: string;
      rewardLinked: string;
    }
  ): Promise<WirdPractice> {
    const response = await fetch(`${this.apiBase}/wirds/${wirdId}/practices/${practiceId}/clear`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clearFramework: clearData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update CLEAR framework');
    }

    return await response.json();
  }
}

// Singleton instance
export const clearService = new CLEARService(); 