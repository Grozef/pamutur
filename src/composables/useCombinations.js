import { ref } from 'vue';

const BASE_URL = '/api/pmu';

export function useCombinations() {
  const combinations = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchTierce = async (raceId, ordre = false, limit = 10) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(
        `${BASE_URL}/races/${raceId}/combinations/tierce?ordre=${ordre}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      combinations.value = data.combinations;
      
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching tierce:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchQuinte = async (raceId, limit = 10) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(
        `${BASE_URL}/races/${raceId}/combinations/quinte?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      combinations.value = data.combinations;
      
      return data;
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching quinte:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    combinations,
    loading,
    error,
    fetchTierce,
    fetchQuinte
  };
}
