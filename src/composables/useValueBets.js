import { ref } from 'vue';

const BASE_URL = '/api/pmu';

export function useValueBets() {
  const valueBets = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchValueBets = async (raceId, bankroll = 1000) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${BASE_URL}/races/${raceId}/value-bets?bankroll=${bankroll}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      valueBets.value = data.value_bets;
      
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching value bets:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    valueBets,
    loading,
    error,
    fetchValueBets
  };
}
