import { ref, computed } from 'vue';
import { pmuApi } from '../services/pmuApi';

export function usePMU() {
  // State
  const loading = ref(false);
  const error = ref(null);
  const programme = ref(null);
  const selectedReunion = ref(null);
  const selectedCourse = ref(null);
  const participants = ref(null);

  // Computed
  const reunions = computed(() => {
    return programme.value?.programme?.reunions || [];
  });

  const courses = computed(() => {
    return selectedReunion.value?.courses || [];
  });

  const horses = computed(() => {
    return participants.value?.participants || [];
  });

  // Methods
  const loadProgramme = async (date = null) => {
    loading.value = true;
    error.value = null;
    
    try {
      programme.value = await pmuApi.getProgramme(date);
      return programme.value;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadReunion = async (reunionNum, date = null) => {
    loading.value = true;
    error.value = null;
    
    try {
      selectedReunion.value = await pmuApi.getReunion(reunionNum, date);
      return selectedReunion.value;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadCourse = async (reunionNum, courseNum, date = null) => {
    loading.value = true;
    error.value = null;
    
    try {
      selectedCourse.value = await pmuApi.getCourse(reunionNum, courseNum, date);
      return selectedCourse.value;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadParticipants = async (reunionNum, courseNum, date = null) => {
    loading.value = true;
    error.value = null;
    
    try {
      participants.value = await pmuApi.getParticipants(reunionNum, courseNum, date);
      return participants.value;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const reset = () => {
    programme.value = null;
    selectedReunion.value = null;
    selectedCourse.value = null;
    participants.value = null;
    error.value = null;
  };

  return {
    // State
    loading,
    error,
    programme,
    selectedReunion,
    selectedCourse,
    participants,
    
    // Computed
    reunions,
    courses,
    horses,
    
    // Methods
    loadProgramme,
    loadReunion,
    loadCourse,
    loadParticipants,
    reset
  };
}
