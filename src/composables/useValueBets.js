import { ref } from 'vue';

const BASE_URL = '/api/pmu';
const DEFAULT_TIMEOUT = 15000;

// FIX: Singleton state
const valueBets = ref([]);
const loading = ref(false);
const error = ref(null);

async function fetchWithTimeout(url, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  }
}

export function useValueBets() {
  const fetchValueBets = async (raceId, bankroll = 1000) => {
    // FIX: Validate inputs
    if (!raceId || raceId <= 0) {
      throw new Error('Invalid race ID');
    }

    const validBankroll = Math.max(10, Math.min(1000000, Number(bankroll) || 1000));

    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/races/${raceId}/value-bets?bankroll=${validBankroll}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // FIX: Validate response structure
      valueBets.value = Array.isArray(data.value_bets) ? data.value_bets : [];

      return {
        race_id: data.race_id || raceId,
        bankroll: data.bankroll || validBankroll,
        value_bets: valueBets.value,
        summary: {
          count: data.summary?.count || 0,
          total_stake: data.summary?.total_stake || 0,
          bankroll_usage: data.summary?.bankroll_usage || '0%',
          total_expected_value: data.summary?.total_expected_value || '0%'
        }
      };
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching value bets:', err);
      valueBets.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    valueBets.value = [];
    error.value = null;
    loading.value = false;
  };

  return {
    valueBets,
    loading,
    error,
    fetchValueBets,
    reset
  };
}