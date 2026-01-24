import { ref, computed } from 'vue';
import { fetchWithTimeout } from '@/utils/fetch';
import { getTodayDDMMYYYY, convertDDMMYYYYToISO } from '@/utils/date';

const BASE_URL = '/api/pmu';
const DEFAULT_TIMEOUT = 10000;

// Singleton state - shared across all components
const loading = ref(false);
const error = ref(null);
const programme = ref(null);
const selectedReunion = ref(null);
const participants = ref(null);

export function usePMU() {
  // Computed properties using singleton state
  const reunions = computed(() => {
    return programme.value?.programme?.reunions || [];
  });

  const courses = computed(() => {
    return selectedReunion.value?.courses || [];
  });

  const horses = computed(() => {
    return participants.value?.participants || [];
  });

  const getTodayDate = () => {
    return getTodayDDMMYYYY();
  };

  const formatDateForApi = (ddmmyyyy) => {
    return convertDDMMYYYYToISO(ddmmyyyy);
  };

  const loadProgramme = async (date = null) => {
    loading.value = true;
    error.value = null;

    try {
      const dateStr = date || getTodayDate();
      const response = await fetchWithTimeout(`${BASE_URL}/${dateStr}`, {}, DEFAULT_TIMEOUT);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      programme.value = await response.json();
      return programme.value;
    } catch (err) {
      error.value = err.message;
      console.error('Error loading programme:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadReunion = async (reunionNum, date = null) => {
    loading.value = true;
    error.value = null;

    try {
      const dateStr = date || getTodayDate();
      const response = await fetchWithTimeout(`${BASE_URL}/${dateStr}/R${reunionNum}`, {}, DEFAULT_TIMEOUT);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      selectedReunion.value = await response.json();
      return selectedReunion.value;
    } catch (err) {
      error.value = err.message;
      console.error('Error loading reunion:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadParticipants = async (reunionNum, courseNum, date = null) => {
    loading.value = true;
    error.value = null;

    try {
      const dateStr = date || getTodayDate();
      const response = await fetchWithTimeout(
        `${BASE_URL}/${dateStr}/R${reunionNum}/C${courseNum}/participants`,
        {},
        DEFAULT_TIMEOUT
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      participants.value = await response.json();
      return participants.value;
    } catch (err) {
      error.value = err.message;
      console.error('Error loading participants:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    programme.value = null;
    selectedReunion.value = null;
    participants.value = null;
    error.value = null;
  };

  return {
    // State (singleton refs)
    loading,
    error,
    programme,
    selectedReunion,
    participants,
    // Computed
    reunions,
    courses,
    horses,
    // Methods
    loadProgramme,
    loadReunion,
    loadParticipants,
    reset,
    getTodayDate,
    formatDateForApi
  };
}
