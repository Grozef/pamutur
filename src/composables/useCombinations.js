import { ref } from 'vue';

const BASE_URL = '/api/pmu';
const DEFAULT_TIMEOUT = 15000;

// FIX: Singleton state
const combinations = ref([]);
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

export function useCombinations() {
  const fetchTierce = async (raceId, ordre = false, limit = 10) => {
    // FIX: Validate inputs
    if (!raceId || raceId <= 0) {
      throw new Error('Invalid race ID');
    }

    const validLimit = Math.max(1, Math.min(50, Number(limit) || 10));

    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/races/${raceId}/combinations/tierce?ordre=${ordre}&limit=${validLimit}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // FIX: Validate response structure
      combinations.value = Array.isArray(data.combinations) ? data.combinations : [];

      return {
        race_id: data.race_id || raceId,
        type: data.type || (ordre ? 'TIERCE_ORDRE' : 'TIERCE_DESORDRE'),
        combinations: combinations.value,
        best_combination: data.best_combination || combinations.value[0] || null,
        total_combinations: data.total_combinations || combinations.value.length
      };
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching tierce:', err);
      combinations.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchQuinte = async (raceId, limit = 10) => {
    // FIX: Validate inputs
    if (!raceId || raceId <= 0) {
      throw new Error('Invalid race ID');
    }

    const validLimit = Math.max(1, Math.min(50, Number(limit) || 10));

    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/races/${raceId}/combinations/quinte?limit=${validLimit}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // FIX: Validate response structure
      combinations.value = Array.isArray(data.combinations) ? data.combinations : [];

      return {
        race_id: data.race_id || raceId,
        type: data.type || 'QUINTE_DESORDRE',
        combinations: combinations.value,
        best_combination: data.best_combination || combinations.value[0] || null,
        total_combinations: data.total_combinations || combinations.value.length
      };
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching quinte:', err);
      combinations.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    combinations.value = [];
    error.value = null;
    loading.value = false;
  };

  return {
    combinations,
    loading,
    error,
    fetchTierce,
    fetchQuinte,
    reset
  };
}