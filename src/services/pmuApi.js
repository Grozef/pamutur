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
  },

  // Betting System APIs

  // Get daily bets (probability > 40%)
  async getDailyBets(date = null) {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `${BASE_URL}/betting/daily-bets?date=${dateParam}`;

    try {
      const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching daily bets:', error);
      throw error;
    }
  },

  // Get value bets (top 20)
  async getValueBets(date = null) {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `${BASE_URL}/betting/value-bets?date=${dateParam}`;

    try {
      const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching value bets:', error);
      throw error;
    }
  },

  // Get combinations
  async getCombinations(date = null) {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `${BASE_URL}/betting/combinations?date=${dateParam}`;

    try {
      const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching combinations:', error);
      throw error;
    }
  },

  // Get betting report
  async getBettingReport(date = null) {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `${BASE_URL}/betting/generate-report?date=${dateParam}`;

    try {
      const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching betting report:', error);
      throw error;
    }
  },

  // Process predictions (store bets)
  async processPredictions(date, predictions) {
    const url = `${BASE_URL}/betting/process-predictions`;

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date, predictions })
      }, DEFAULT_TIMEOUT);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error processing predictions:', error);
      throw error;
    }
  },

  // Fetch results from PMU
  async fetchResults() {
    const url = `${BASE_URL}/betting/fetch-results`;

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST'
      }, DEFAULT_TIMEOUT);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching results:', error);
      throw error;
    }
  }
};
