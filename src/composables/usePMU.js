import { ref, computed } from 'vue';

const BASE_URL = '/api/pmu';
const DEFAULT_TIMEOUT = 10000;

async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

export function usePMU() {
  const loading = ref(false);
  const error = ref(null);
  const programme = ref(null);
  const selectedReunion = ref(null);
  const participants = ref(null);

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
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}${month}${year}`;
  };

  const loadProgramme = async (date = null) => {
    loading.value = true;
    error.value = null;
    
    try {
      const dateStr = date || getTodayDate();
      const response = await fetchWithTimeout(`${BASE_URL}/${dateStr}`);
      
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
      const response = await fetchWithTimeout(`${BASE_URL}/${dateStr}/R${reunionNum}`);
      
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
        `${BASE_URL}/${dateStr}/R${reunionNum}/C${courseNum}/participants`
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
    loading,
    error,
    programme,
    selectedReunion,
    participants,
    reunions,
    courses,
    horses,
    loadProgramme,
    loadReunion,
    loadParticipants,
    reset,
    getTodayDate
  };
}
