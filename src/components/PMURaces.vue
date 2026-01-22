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

      <!-- DROITE: Participants + Analyses -->
      <div class="right-panel">
        <!-- Participants -->
        <section class="participants-panel">
          <div class="panel-header">
            <h2>Partants</h2>
            <button
              v-if="horses.length > 0"
              @click="showAnalyses = !showAnalyses"
              class="analyze-btn"
            >
              {{ showAnalyses ? 'Masquer analyses' : 'Voir analyses' }}
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

        <!-- Analyses (Value Bets & Combinaisons) -->
        <section v-if="showAnalyses" class="analysis-panel">
          <div class="analysis-tabs">
            <button 
              :class="{ active: activeTab === 'valuebets' }"
              @click="activeTab = 'valuebets'"
            >
              Value Bets
            </button>
            <button 
              :class="{ active: activeTab === 'tierce' }"
              @click="activeTab = 'tierce'"
            >
              Tiercé
            </button>
            <button 
              :class="{ active: activeTab === 'quinte' }"
              @click="activeTab = 'quinte'"
            >
              Quinté
            </button>
          </div>

          <!-- Value Bets Tab -->
          <div v-if="activeTab === 'valuebets'" class="tab-content">
            <div class="tab-header">
              <label>
                Bankroll: 
                <input v-model.number="bankroll" type="number" min="10" />€
              </label>
              <button @click="loadValueBets" :disabled="loadingAnalysis">
                Analyser
              </button>
            </div>
            
            <div v-if="valueBetsData" class="analysis-result">
              <div class="summary">
                <p><strong>{{ valueBetsData.summary.count }}</strong> value bets</p>
                <p>Mise totale: <strong>{{ valueBetsData.summary.total_stake }}€</strong></p>
                <p>EV Total: <strong>+{{ valueBetsData.summary.total_expected_value }}</strong></p>
              </div>

              <div class="value-bets-list">
                <div 
                  v-for="bet in valueBetsData.value_bets" 
                  :key="bet.horse_id"
                  class="value-bet-card"
                >
                  <div class="horse-name">{{ bet.horse_name }}</div>
                  <div class="bet-info">
                    <span>Cote: {{ bet.odds }}</span>
                    <span>Proba: {{ bet.probability }}%</span>
                  </div>
                  <div class="kelly-data">
                    <div>Miser: <strong>{{ bet.kelly_data.recommended_stake }}€</strong></div>
                    <div class="ev-positive">EV: +{{ bet.kelly_data.expected_value }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tiercé Tab -->
          <div v-if="activeTab === 'tierce'" class="tab-content">
            <div class="tab-header">
              <label>
                <input type="checkbox" v-model="tierceOrdre" />
                Ordre
              </label>
              <button @click="loadTierce" :disabled="loadingAnalysis">
                Générer
              </button>
            </div>

            <div v-if="tierceData" class="analysis-result">
              <div class="combinations-list">
                <div 
                  v-for="(combo, i) in tierceData.combinations" 
                  :key="i"
                  class="combo-card"
                >
                  <div class="combo-rank">#{{ i + 1 }}</div>
                  <div class="combo-horses">
                    {{ combo.horses.join(' - ') }}
                  </div>
                  <div class="combo-stats">
                    <span>Proba: {{ combo.probability.toFixed(2) }}%</span>
                    <span class="ev-positive">EV: +{{ combo.ev_analysis.ev_percentage }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quinté Tab -->
          <div v-if="activeTab === 'quinte'" class="tab-content">
            <div class="tab-header">
              <button @click="loadQuinte" :disabled="loadingAnalysis">
                Générer
              </button>
            </div>

            <div v-if="quinteData" class="analysis-result">
              <div class="combinations-list">
                <div 
                  v-for="(combo, i) in quinteData.combinations" 
                  :key="i"
                  class="combo-card"
                >
                  <div class="combo-rank">#{{ i + 1 }}</div>
                  <div class="combo-horses">
                    {{ combo.horses.join(' - ') }}
                  </div>
                  <div class="combo-stats">
                    <span>Proba: {{ combo.probability.toFixed(2) }}%</span>
                    <span class="ev-positive">EV: +{{ combo.ev_analysis.ev_percentage }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Horse Details (si pas d'analyses affichées) -->
        <section v-else class="horse-details-panel">
          <h2>Détails</h2>
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
import { useValueBets } from '../composables/useValueBets';
import { useCombinations } from '../composables/useCombinations';

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

const { fetchValueBets } = useValueBets();
const { fetchTierce, fetchQuinte } = useCombinations();

const selectedReunionNum = ref(null);
const selectedCourseNum = ref(null);
const selectedHorse = ref(null);
const showAnalyses = ref(false);
const activeTab = ref('valuebets');
const loadingAnalysis = ref(false);

// Value Bets
const bankroll = ref(1000);
const valueBetsData = ref(null);

// Combinaisons
const tierceOrdre = ref(false);
const tierceData = ref(null);
const quinteData = ref(null);

// Fake race ID for demo (should be from real data)
const currentRaceId = ref(1);

const handleLoadProgramme = async () => {
  selectedReunionNum.value = null;
  selectedCourseNum.value = null;
  selectedHorse.value = null;
  showAnalyses.value = false;
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
  showAnalyses.value = false;
  try {
    await loadReunion(reunion.numOfficiel);
  } catch (err) {
    console.error('Failed to load reunion:', err);
  }
};

const handleSelectCourse = async (course) => {
  selectedCourseNum.value = course.numOrdre;
  selectedHorse.value = null;
  showAnalyses.value = false;
  try {
    await loadParticipants(selectedReunionNum.value, course.numOrdre);
  } catch (err) {
    console.error('Failed to load participants:', err);
  }
};

const loadValueBets = async () => {
  loadingAnalysis.value = true;
  try {
    valueBetsData.value = await fetchValueBets(currentRaceId.value, bankroll.value);
  } catch (err) {
    console.error('Failed to load value bets:', err);
  } finally {
    loadingAnalysis.value = false;
  }
};

const loadTierce = async () => {
  loadingAnalysis.value = true;
  try {
    tierceData.value = await fetchTierce(currentRaceId.value, tierceOrdre.value, 10);
  } catch (err) {
    console.error('Failed to load tierce:', err);
  } finally {
    loadingAnalysis.value = false;
  }
};

const loadQuinte = async () => {
  loadingAnalysis.value = true;
  try {
    quinteData.value = await fetchQuinte(currentRaceId.value, 10);
  } catch (err) {
    console.error('Failed to load quinte:', err);
  } finally {
    loadingAnalysis.value = false;
  }
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

.analysis-panel,
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

.analyze-btn {
  background: #27ae60;
  padding: 6px 12px;
  font-size: 12px;
}

.analyze-btn:hover {
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

/* Analysis Tabs */
.analysis-tabs {
  display: flex;
  background: #ecf0f1;
  border-bottom: 2px solid #ddd;
}

.analysis-tabs button {
  flex: 1;
  background: transparent;
  color: #666;
  border: none;
  padding: 12px;
  border-radius: 0;
}

.analysis-tabs button.active {
  background: white;
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
}

.tab-content {
  padding: 15px;
}

.tab-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.tab-header label {
  display: flex;
  align-items: center;
  gap: 5px;
}

.tab-header input[type="number"] {
  width: 80px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.summary {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.summary p {
  margin: 5px 0;
}

.value-bets-list,
.combinations-list {
  display: grid;
  gap: 10px;
}

.value-bet-card,
.combo-card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 12px;
}

.horse-name,
.combo-horses {
  font-weight: bold;
  margin-bottom: 8px;
}

.bet-info,
.combo-stats {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.kelly-data {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #ddd;
  font-size: 13px;
}

.ev-positive {
  color: #2e7d32;
  font-weight: bold;
}

.combo-rank {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 8px;
}

.horse-details {
  padding: 15px;
}

.horse-details h3 {
  margin: 0 0 15px 0;
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
