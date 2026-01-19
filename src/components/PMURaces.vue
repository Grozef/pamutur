<template>
  <div class="pmu-layout">
    <header>
      <h1>Programme PMU</h1>
      <button @click="handleLoadProgramme" :disabled="loading">
        {{ loading ? 'Chargement...' : 'Charger le programme' }}
      </button>
      <div v-if="error" class="error">{{ error }}</div>
    </header>

    <div class="main-grid">
      <!-- GAUCHE: Réunions -->
      <aside class="reunions-panel">
        <h2>Réunions</h2>
        <div v-if="reunions.length === 0" class="empty">
          Chargez le programme
        </div>
        <div
          v-for="reunion in reunions"
          :key="reunion.numOfficiel"
          :class="['reunion-item', { active: selectedReunionNum === reunion.numOfficiel }]"
          @click="handleSelectReunion(reunion)"
        >
          <div class="reunion-header">
            <strong>R{{ reunion.numOfficiel }}</strong>
            <span>{{ reunion.hippodrome.libelleCourt }}</span>
          </div>
          <div class="reunion-info">
            {{ reunion.courses?.length || 0 }} courses
          </div>
        </div>
      </aside>

      <!-- MILIEU: Courses -->
      <section class="courses-panel">
        <h2>Courses</h2>
        <div v-if="courses.length === 0" class="empty">
          Sélectionnez une réunion
        </div>
        <div
          v-for="course in courses"
          :key="course.numOrdre"
          :class="['course-item', { active: selectedCourseNum === course.numOrdre }]"
          @click="handleSelectCourse(course)"
        >
          <div class="course-header">
            <strong>C{{ course.numOrdre }}</strong>
            <span class="course-time">{{ course.heureDepart }}</span>
          </div>
          <div class="course-title">{{ course.libelle }}</div>
          <div class="course-details">
            {{ course.discipline }} - {{ course.distance }}m - {{ course.nombreDeclaresPartants }} partants
          </div>
        </div>
      </section>

      <!-- DROITE: Participants + Détails -->
      <div class="right-panel">
        <!-- DROITE HAUT: Liste participants -->
        <section class="participants-panel">
          <div class="panel-header">
            <h2>Partants</h2>
            <button
              v-if="horses.length > 0"
              @click="downloadAllParticipants"
              class="download-btn"
            >
              ⬇ Télécharger tous
            </button>
          </div>
          <div v-if="horses.length === 0" class="empty">
            Sélectionnez une course
          </div>
          <div
            v-for="horse in horses"
            :key="horse.numPmu"
            :class="['horse-item', { active: selectedHorse?.numPmu === horse.numPmu }]"
            @click="selectedHorse = horse"
          >
            <div class="horse-num">{{ horse.numPmu }}</div>
            <div class="horse-main">
              <strong>{{ horse.nom }}</strong>
              <div class="horse-meta">
                {{ horse.driver }} - {{ horse.age }}ans
              </div>
              <div class="horse-musique">{{ horse.musique }}</div>
            </div>
            <div class="horse-cote">
              {{ horse.dernierRapportDirect?.rapport || '-' }}
            </div>
          </div>
        </section>

        <!-- DROITE BAS: Détails participant -->
        <section class="horse-details-panel">
          <div class="panel-header">
            <h2>Détails</h2>
            <button
              v-if="selectedHorse"
              @click="downloadHorse"
              class="download-btn"
            >
              ⬇ Télécharger
            </button>
          </div>
          <div v-if="!selectedHorse" class="empty">
            Cliquez sur un cheval
          </div>
          <div v-else class="horse-details">
            <h3>{{ selectedHorse.nom }}</h3>

            <div class="details-grid">
              <div v-for="(value, key) in selectedHorse" :key="key" class="detail-row">
                <div class="detail-key">{{ key }}</div>
                <div class="detail-value">
                  <pre v-if="typeof value === 'object' && value !== null">{{ JSON.stringify(value, null, 2) }}</pre>
                  <span v-else>{{ value }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePMU } from '../composables/usePMU';

const {
  loading,
  error,
  reunions,
  courses,
  horses,
  loadProgramme,
  loadReunion,
  loadParticipants
} = usePMU();

const selectedReunionNum = ref(null);
const selectedCourseNum = ref(null);
const selectedHorse = ref(null);

const handleLoadProgramme = async () => {
  selectedReunionNum.value = null;
  selectedCourseNum.value = null;
  selectedHorse.value = null;
  try {
    await loadProgramme();
  } catch (err) {
    console.error('Failed to load programme:', err);
  }
};

const handleSelectReunion = async (reunion) => {
  selectedReunionNum.value = reunion.numOfficiel;
  selectedCourseNum.value = null;
  selectedHorse.value = null;
  try {
    await loadReunion(reunion.numOfficiel);
  } catch (err) {
    console.error('Failed to load reunion:', err);
  }
};

const handleSelectCourse = async (course) => {
  selectedCourseNum.value = course.numOrdre;
  selectedHorse.value = null;
  try {
    await loadParticipants(selectedReunionNum.value, course.numOrdre);
  } catch (err) {
    console.error('Failed to load participants:', err);
  }
};

const downloadHorse = () => {
  if (!selectedHorse.value) return;

  const dataStr = JSON.stringify(selectedHorse.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cheval_${selectedHorse.value.nom}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadAllParticipants = () => {
  if (horses.value.length === 0) return;

  const dataStr = JSON.stringify(horses.value, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `course_R${selectedReunionNum.value}C${selectedCourseNum.value}_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.pmu-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: #2c3e50;
  color: white;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
  margin: 0 0 10px 0;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background: #2980b9;
}

button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.error {
  background: #e74c3c;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

.main-grid {
  display: grid;
  grid-template-columns: 250px 350px 1fr;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

.reunions-panel,
.courses-panel,
.right-panel {
  border-right: 1px solid #ddd;
  overflow-y: auto;
  background: white;
}

.right-panel {
  display: flex;
  flex-direction: column;
  border-right: none;
}

.participants-panel {
  flex: 1;
  overflow-y: auto;
  border-bottom: 1px solid #ddd;
}

.horse-details-panel {
  flex: 1;
  overflow-y: auto;
}

h2 {
  margin: 0;
  padding: 15px;
  background: #ecf0f1;
  border-bottom: 1px solid #ddd;
  font-size: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #ecf0f1;
  border-bottom: 1px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}

.panel-header h2 {
  margin: 0;
  padding: 0;
  background: none;
  border: none;
  position: static;
}

.download-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.download-btn:hover {
  background: #229954;
}

.empty {
  padding: 20px;
  text-align: center;
  color: #95a5a6;
}

.reunion-item,
.course-item,
.horse-item {
  padding: 12px 15px;
  border-bottom: 1px solid #ecf0f1;
  cursor: pointer;
  transition: background 0.2s;
}

.reunion-item:hover,
.course-item:hover,
.horse-item:hover {
  background: #f8f9fa;
}

.reunion-item.active,
.course-item.active,
.horse-item.active {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.reunion-header,
.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.reunion-info,
.course-details {
  font-size: 12px;
  color: #7f8c8d;
}

.course-title {
  margin: 5px 0;
  font-size: 14px;
}

.course-time {
  font-size: 12px;
  color: #e74c3c;
  font-weight: bold;
}

.horse-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.horse-num {
  background: #3498db;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.horse-main {
  flex: 1;
}

.horse-main strong {
  display: block;
}

.horse-meta {
  font-size: 12px;
  color: #7f8c8d;
  margin: 2px 0;
}

.horse-musique {
  font-family: monospace;
  font-size: 11px;
  color: #2c3e50;
}

.horse-cote {
  font-weight: bold;
  color: #e67e22;
  font-size: 14px;
}

.horse-details {
  padding: 15px;
}

.horse-details h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
}

.detail-key {
  font-weight: bold;
  color: #34495e;
}

.detail-value pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 11px;
  background: white;
  padding: 5px;
  border-radius: 3px;
  border: 1px solid #dee2e6;
}

.detail-value span {
  word-break: break-word;
}
</style>