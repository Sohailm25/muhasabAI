/**
 * Masjidi API Client
 * Based on the API documentation at https://api.masjidiapp.com/docs#/
 */
import axios from "axios";

// Console logger function
const log = {
  info: (message: string) => console.log(`[MASJIDI API] INFO: ${message}`),
  error: (message: string, error?: any) => console.error(`[MASJIDI API] ERROR: ${message}`, error || '')
};

// Constants
const API_BASE_URL = "https://api.masjidiapp.com";
const API_VERSION = "v1";

export interface MasjidSearchResult {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
}

export interface Masjid extends MasjidSearchResult {
  email?: string;
  imam?: string;
  pictures?: string[];
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  services?: string[];
  tags?: string[];
}

export interface PrayerTime {
  name: string;
  athan: string; // 24-hour format, e.g., "05:15"
  iqama: string; // 24-hour format, e.g., "05:45"
}

export interface DailyPrayerTimes {
  date: string; // YYYY-MM-DD
  fajr: PrayerTime;
  dhuhr: PrayerTime;
  asr: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
  jummah?: PrayerTime[]; // Multiple jummah times for Friday
}

/**
 * Search for masjids by zip code
 * @param zipCode The zip code to search for
 * @returns An array of masjids matching the zip code
 */
export async function searchMasjidsByZipCode(zipCode: string): Promise<MasjidSearchResult[]> {
  try {
    log.info(`Searching for masjids in zip code: ${zipCode}`);
    
    const response = await axios.get(`${API_BASE_URL}/${API_VERSION}/masjids/search`, {
      params: { zip: zipCode }
    });
    
    return response.data;
  } catch (error) {
    log.error('Error searching for masjids by zip code', error);
    throw new Error('Failed to search for masjids');
  }
}

/**
 * Get details for a specific masjid
 * @param masjidId The ID of the masjid
 * @returns Detailed information about the masjid
 */
export async function getMasjidDetails(masjidId: string): Promise<Masjid> {
  try {
    log.info(`Getting details for masjid: ${masjidId}`);
    
    const response = await axios.get(`${API_BASE_URL}/${API_VERSION}/masjids/${masjidId}`);
    
    return response.data;
  } catch (error) {
    log.error(`Error getting masjid details for ID: ${masjidId}`, error);
    throw new Error('Failed to get masjid details');
  }
}

/**
 * Get prayer times for a specific masjid on a specific date
 * If no date is provided, uses today's date
 * @param masjidId The ID of the masjid
 * @param date Optional date in format YYYY-MM-DD, defaults to today
 * @returns Prayer times for the masjid
 */
export async function getMasjidPrayerTimes(
  masjidId: string,
  date?: string
): Promise<DailyPrayerTimes> {
  try {
    // Use today's date if not provided
    const requestDate = date || new Date().toISOString().split('T')[0];
    
    log.info(`Getting prayer times for masjid: ${masjidId}, date: ${requestDate}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/${API_VERSION}/masjids/${masjidId}/prayertimes`,
      { params: { date: requestDate } }
    );
    
    return response.data;
  } catch (error) {
    log.error(`Error getting prayer times for masjid ID: ${masjidId}`, error);
    throw new Error('Failed to get prayer times');
  }
}

/**
 * Get weekly prayer times for a specific masjid
 * Returns prayer times for the current week
 * @param masjidId The ID of the masjid
 * @returns Prayer times for the masjid for the current week
 */
export async function getMasjidWeeklyPrayerTimes(
  masjidId: string
): Promise<DailyPrayerTimes[]> {
  try {
    log.info(`Getting weekly prayer times for masjid: ${masjidId}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/${API_VERSION}/masjids/${masjidId}/prayertimes/week`
    );
    
    return response.data;
  } catch (error) {
    log.error(`Error getting weekly prayer times for masjid ID: ${masjidId}`, error);
    throw new Error('Failed to get weekly prayer times');
  }
}

// Add methods to get monthly prayer times if needed in the future
// export async function getMasjidMonthlyPrayerTimes() {...}

export default {
  searchMasjidsByZipCode,
  getMasjidDetails,
  getMasjidPrayerTimes,
  getMasjidWeeklyPrayerTimes
}; 