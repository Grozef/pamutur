import { fetchWithTimeout } from '@/utils/fetch';
import { getTodayDDMMYYYY, formatDateToDDMMYYYY } from '@/utils/date';

const BASE_URL = '/api/pmu';
const DEFAULT_TIMEOUT = 10000;

export const pmuApi = {
  // Get today's date in DDMMYYYY format
  getTodayDate() {
    return getTodayDDMMYYYY();
  },

  // Get date in DDMMYYYY format from Date object
  formatDate(date) {
    return formatDateToDDMMYYYY(date);
  },

  // Fetch daily program
  async getProgramme(date = null) {
    const dateStr = date || this.getTodayDate();
    const url = `${BASE_URL}/${dateStr}`;

    try {
      const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
      if (!response.ok) {
        const errorMessage = response.status === 404
          ? 'Programme not found for this date'
          : response.status === 500
          ? 'Server error - please try again later'
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching programme:', error);
      throw error;
    }
  },

  // Fetch specific reunion
  async getReunion(reunionNum, date = null) {
    const dateStr = date || this.getTodayDate();
    const url = `${BASE_URL}/${dateStr}/R${reunionNum}`;

    try {
      const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
      if (!response.ok) {
        const errorMessage = response.status === 404
          ? 'Reunion not found'
          : response.status === 500
          ? 'Server error - please try again later'
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching reunion:', error);
      throw error;
    }
  },

  // Fetch participants (horses with their "musique")
  async getParticipants(reunionNum, courseNum, date = null) {
    const dateStr = date || this.getTodayDate();
    const url = `${BASE_URL}/${dateStr}/R${reunionNum}/C${courseNum}/participants`;

    try {
      const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
      if (!response.ok) {
        const errorMessage = response.status === 404
          ? 'Participants not found'
          : response.status === 500
          ? 'Server error - please try again later'
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }
  }
};
