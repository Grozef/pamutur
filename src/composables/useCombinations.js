import { ref } from 'vue';
import { fetchWithTimeout } from '@/utils/fetch';

const BASE_URL = '/api/pmu';
const DEFAULT_TIMEOUT = 15000;

// Singleton state
const combinations = ref([]);
const loading = ref(false);
const error = ref(null);

export function useCombinations() {
  const fetchTierce = async (raceId, ordre = false, limit = 10) => {
    // Validate inputs
    if (!raceId || raceId <= 0) {
      throw new Error('Invalid race ID');
    }

    const validLimit = Math.max(1, Math.min(50, Number(limit) || 10));

    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/races/${raceId}/combinations/tierce?ordre=${ordre}&limit=${validLimit}`,
        {},
        DEFAULT_TIMEOUT
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
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
    // Validate inputs
    if (!raceId || raceId <= 0) {
      throw new Error('Invalid race ID');
    }

    const validLimit = Math.max(1, Math.min(50, Number(limit) || 10));

    loading.value = true;
    error.value = null;

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/races/${raceId}/combinations/quinte?limit=${validLimit}`,
        {},
        DEFAULT_TIMEOUT
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
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
