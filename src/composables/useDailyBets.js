import { ref } from 'vue';

const BASE_URL = '/api/pmu';

export function useDailyBets() {
  const topBets = ref(null);
  const topCombinations = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchTopBets = async (date = null, bankroll = 1000, limit = 5) => {
    loading.value = true;
    error.value = null;

    try {
      const dateParam = date || new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${BASE_URL}/daily/top-bets?date=${dateParam}&bankroll=${bankroll}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      topBets.value = data;

      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching top bets:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTopCombinations = async (date = null, type = 'tierce', limit = 3) => {
    loading.value = true;
    error.value = null;

    try {
      const dateParam = date || new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${BASE_URL}/daily/top-combinations?date=${dateParam}&type=${type}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      topCombinations.value = data;

      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching top combinations:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    topBets,
    topCombinations,
    loading,
    error,
    fetchTopBets,
    fetchTopCombinations
  };
}