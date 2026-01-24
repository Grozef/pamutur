import { ref } from 'vue';
import { fetchWithTimeout } from '@/utils/fetch';
import { getTodayISO } from '@/utils/date';

const BASE_URL = '/api/pmu';
const DEFAULT_TIMEOUT = 30000; // 30 seconds for daily analysis

// Singleton state for shared access
const topBets = ref(null);
const topCombinations = ref(null);
const loading = ref(false);
const error = ref(null);

export function useDailyBets() {
  const fetchTopBets = async (date = null, bankroll = 1000, limit = 5) => {
    loading.value = true;
    error.value = null;
    topBets.value = null;

    try {
      const dateParam = date || getTodayISO();

      // Validate parameters
      const validBankroll = Math.max(100, Math.min(1000000, Number(bankroll) || 1000));
      const validLimit = Math.max(1, Math.min(20, Number(limit) || 5));

      const response = await fetchWithTimeout(
        `${BASE_URL}/daily/top-bets?date=${dateParam}&bankroll=${validBankroll}&limit=${validLimit}`,
        {},
        DEFAULT_TIMEOUT
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      // Ensure required fields exist with defaults
      topBets.value = {
        date: data.date || dateParam,
        races_count: data.races_count || 0,
        total_value_bets: data.total_value_bets || 0,
        top_bets: Array.isArray(data.top_bets) ? data.top_bets : [],
        summary: {
          total_stake: data.summary?.total_stake || 0,
          total_expected_value: data.summary?.total_expected_value || 0,
          average_ev: data.summary?.average_ev || 0,
          bankroll_usage: data.summary?.bankroll_usage || 0,
          estimated_roi: data.summary?.estimated_roi || 0
        },
        message: data.message || null
      };

      return topBets.value;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching top bets:', err);

      // Set empty state on error
      topBets.value = {
        date: date || getTodayISO(),
        races_count: 0,
        total_value_bets: 0,
        top_bets: [],
        summary: {
          total_stake: 0,
          total_expected_value: 0,
          average_ev: 0,
          bankroll_usage: 0,
          estimated_roi: 0
        },
        message: err.message
      };

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTopCombinations = async (date = null, type = 'tierce', limit = 3) => {
    loading.value = true;
    error.value = null;
    topCombinations.value = null;

    try {
      const dateParam = date || getTodayISO();

      // Validate type parameter
      const validType = ['tierce', 'quinte'].includes(type) ? type : 'tierce';
      const validLimit = Math.max(1, Math.min(20, Number(limit) || 3));

      const response = await fetchWithTimeout(
        `${BASE_URL}/daily/top-combinations?date=${dateParam}&type=${validType}&limit=${validLimit}`,
        {},
        DEFAULT_TIMEOUT
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate and normalize response
      topCombinations.value = {
        date: data.date || dateParam,
        type: data.type || validType,
        races_analyzed: data.races_analyzed || 0,
        combinations: Array.isArray(data.combinations) ? data.combinations : [],
        message: data.message || null
      };

      return topCombinations.value;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching top combinations:', err);

      // Set empty state on error
      topCombinations.value = {
        date: date || getTodayISO(),
        type: type,
        races_analyzed: 0,
        combinations: [],
        message: err.message
      };

      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    topBets.value = null;
    topCombinations.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    // State (singleton refs)
    topBets,
    topCombinations,
    loading,
    error,
    // Methods
    fetchTopBets,
    fetchTopCombinations,
    reset
  };
}
