<template>
  <div class="top-horses-page">
    <header>
      <h1>Top Chevaux par Winrate</h1>
      <div class="controls">
        <input
          type="date"
          v-model="selectedDate"
          @change="loadAllPredictions"
        />
        <button @click="loadAllPredictions" :disabled="loading">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>
    </header>

    <div class="stats" v-if="!loading">
      <div class="stat-card">
        <div class="stat-value">{{ races.length }}</div>
        <div class="stat-label">Courses</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ allPredictions.length }}</div>
        <div class="stat-label">Chevaux</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-value">{{ valueBets.length }}</div>
        <div class="stat-label">Value Bets</div>
      </div>
      <div class="stat-card scenario">
        <div class="stat-value">{{ scenariosCount }}</div>
        <div class="stat-label">Scénarios Détectés</div>
      </div>
    </div>

    <div class="tabs">
      <button
        :class="{ active: currentTab === 'all' }"
        @click="currentTab = 'all'"
      >
        Tous ({{ sortedHorses.length }})
      </button>
      <button
        :class="{ active: currentTab === 'value' }"
        @click="currentTab = 'value'"
      >
        Value Bets ({{ valueBets.length }})
      </button>
      <button
        :class="{ active: currentTab === 'grouped' }"
        @click="currentTab = 'grouped'"
      >
        Top Groupes ({{ topGroupHorses.length }})
      </button>
    </div>

    <div v-if="loading" class="loading">
      Chargement des prédictions...
    </div>

    <div v-else class="horses-grid">
      <div
        v-for="(horse, index) in displayedHorses"
        :key="`${horse.horse_id}-${horse.race_id}`"
        class="horse-card"
        :class="{
          'value-bet': horse.value_bet,
          'top-group': horse.in_top_group
        }"
      >
        <div class="rank">{{ index + 1 }}</div>

        <div class="horse-main">
          <!-- Scénario Badge -->
          <div
            v-if="horse.race_scenario && shouldShowScenario(horse, index)"
            class="scenario-badge"
            :class="getScenarioClass(horse.race_scenario.scenario)"
          >
            <span class="scenario-icon">{{ getScenarioIcon(horse.race_scenario.scenario) }}</span>
            <span class="scenario-text">{{ horse.race_scenario.description }}</span>
          </div>

          <div class="horse-header">
            <h3>
              <span v-if="horse.in_top_group" class="top-icon">🏆</span>
              {{ horse.horse_name }}
            </h3>
            <div class="probability" :class="getProbabilityClass(horse.probability)">
              {{ horse.probability.toFixed(1) }}%
            </div>
          </div>

          <div class="horse-details">
            <span class="badge">{{ horse.race_code }}</span>
            <span class="info">{{ horse.hippodrome }}</span>
            <span class="info">{{ horse.distance }}m</span>
            <span class="info">{{ horse.race_time }}</span>
          </div>

          <div class="horse-meta">
            <span v-if="horse.jockey_name" class="jockey">
              Jockey: {{ horse.jockey_name }}
            </span>
            <span v-if="horse.draw" class="draw">
              Corde {{ horse.draw }}
            </span>
            <span v-if="horse.odds_ref" class="odds">
              Cote: {{ horse.odds_ref.toFixed(1) }}
            </span>
          </div>

          <!-- Indicateurs -->
          <div class="indicators">
            <span v-if="horse.in_top_group" class="indicator top-group-indicator">
              TOP GROUPE
            </span>
            <span v-if="horse.value_bet" class="indicator value-indicator">
              VALUE BET
            </span>
          </div>
        </div>
      </div>

      <div v-if="sortedHorses.length === 0 && !loading" class="empty">
        Aucune prédiction disponible.
        <br>Lancez d'abord: <code>php artisan pmu:fetch</code>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const races = ref([])
const allPredictions = ref([])
const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const currentTab = ref('all')

async function loadAllPredictions() {
  loading.value = true
  allPredictions.value = []

  try {
    const racesResponse = await fetch(
      `/api/pmu/races?date=${selectedDate.value}`
    )

    if (!racesResponse.ok) {
      throw new Error(`HTTP error! status: ${racesResponse.status}`)
    }

    const racesData = await racesResponse.json()
    races.value = Array.isArray(racesData) ? racesData : []

    console.log('Courses récupérées:', races.value.length)

    for (const race of races.value) {
      try {
        const predResponse = await fetch(
          `/api/pmu/races/${race.id}/predictions`
        )

        if (!predResponse.ok) {
          console.warn(`Course ${race.id} - predictions non disponibles`)
          continue
        }

        const predData = await predResponse.json()

        if (predData.predictions && Array.isArray(predData.predictions)) {
  const scenario = predData.predictions[0]?.race_scenario || null

  predData.predictions.forEach(pred => {
            allPredictions.value.push({
              ...pred,
              race_id: race.id,
              race_code: race.code,
              hippodrome: race.hippodrome,
              distance: race.distance,
              discipline: race.discipline,
              race_time: new Date(race.date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              race_scenario: scenario
            })
          })
        }
      } catch (err) {
        console.error(`Erreur course ${race.id}:`, err)
      }
    }

    console.log('Total prédictions:', allPredictions.value.length)
  } catch (error) {
    console.error('Erreur chargement:', error)
    races.value = []
  } finally {
    loading.value = false
  }
}

const sortedHorses = computed(() => {
  return [...allPredictions.value].sort((a, b) => b.probability - a.probability)
})

const valueBets = computed(() => {
  return sortedHorses.value.filter(h => h.value_bet)
})

const topGroupHorses = computed(() => {
  return sortedHorses.value.filter(h => h.in_top_group)
})

const displayedHorses = computed(() => {
  if (currentTab.value === 'value') return valueBets.value
  if (currentTab.value === 'grouped') return topGroupHorses.value
  return sortedHorses.value
})

const scenariosCount = computed(() => {
  const scenarios = new Set()
  allPredictions.value.forEach(p => {
    if (p.race_scenario) {
      scenarios.add(`${p.race_id}-${p.race_scenario.scenario}`)
    }
  })
  return scenarios.size
})

function shouldShowScenario(horse, index) {
  if (index === 0) return true

  const currentList = displayedHorses.value
  const previousHorse = currentList[index - 1]

  return horse.race_id !== previousHorse?.race_id
}

function getScenarioIcon(scenario) {
  const icons = {
    'DOMINANT_FAVORITE': '👑',
    'CLEAR_TOP_2': '🥇',
    'STANDARD_TOP_3': '🏅',
    'GROUPED_TOP_4': '⚖️',
    'GROUPED_TOP_5': '🎲',
    'OPEN_RACE': '🌟'
  }
  return icons[scenario] || '📊'
}

function getScenarioClass(scenario) {
  return scenario?.toLowerCase().replace(/_/g, '-') || 'default'
}

function getProbabilityClass(probability) {
  if (probability >= 30) return 'very-high'
  if (probability >= 20) return 'high'
  if (probability >= 10) return 'medium'
  return 'low'
}

onMounted(() => {
  loadAllPredictions()
})
</script>

<style scoped>
.top-horses-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 10px;
}

input[type="date"] {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card.highlight {
  background: #e8f5e9;
  border: 2px solid #4caf50;
}

.stat-card.scenario {
  background: #e3f2fd;
  border: 2px solid #2196f3;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 5px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tabs button {
  flex: 1;
  background: white;
  color: #2c3e50;
  border: 2px solid #ddd;
}

.tabs button.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #7f8c8d;
}

.horses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 20px;
}

.horse-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  gap: 15px;
  transition: transform 0.2s;
}

.horse-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.horse-card.value-bet {
  border: 2px solid #4caf50;
  background: #f1f8e9;
}

.horse-card.top-group {
  border-left: 4px solid #ff9800;
}

.rank {
  background: #3498db;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
}

.horse-main {
  flex: 1;
}

.scenario-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
}

.scenario-badge.dominant-favorite {
  background: #fff3e0;
  border: 2px solid #ff9800;
  color: #e65100;
}

.scenario-badge.clear-top-2 {
  background: #fce4ec;
  border: 2px solid #e91e63;
  color: #880e4f;
}

.scenario-badge.standard-top-3 {
  background: #e3f2fd;
  border: 2px solid #2196f3;
  color: #0d47a1;
}

.scenario-badge.grouped-top-4,
.scenario-badge.grouped-top-5 {
  background: #f3e5f5;
  border: 2px solid #9c27b0;
  color: #4a148c;
}

.scenario-badge.open-race {
  background: #e8f5e9;
  border: 2px solid #4caf50;
  color: #1b5e20;
}

.scenario-icon {
  font-size: 18px;
}

.scenario-text {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.horse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.horse-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-icon {
  font-size: 20px;
}

.probability {
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
}

.probability.very-high {
  background: #c62828;
}

.probability.high {
  background: #f57c00;
}

.probability.medium {
  background: #2196f3;
}

.probability.low {
  background: #757575;
}

.horse-details {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.badge {
  background: #e74c3c;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.info {
  color: #7f8c8d;
  font-size: 13px;
}

.horse-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #34495e;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.indicators {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.indicator {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.top-group-indicator {
  background: #ff9800;
  color: white;
}

.value-indicator {
  background: #4caf50;
  color: white;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}
</style>