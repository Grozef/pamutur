<template>
  <div class="stored-bets-page">
    <header>
      <div class="header-content">
        <h1>📋 Paris Stockés</h1>
        <p class="subtitle">Visualisez les paris enregistrés en base de données</p>
      </div>
      <div class="controls">
        <input
          type="date"
          v-model="selectedDate"
          @change="loadStoredBets"
        />
        <button @click="loadStoredBets" :disabled="loading" class="refresh-btn">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
        <button @click="clearBets" :disabled="clearing || !hasBets" class="clear-btn">
          {{ clearing ? 'Suppression...' : '🗑️ Tout Effacer' }}
        </button>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="stats-cards" v-if="!loading">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ dailyBets.length }}</div>
          <div class="stat-label">Paris Quotidiens</div>
          <div class="stat-detail">Probabilité > 40%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💎</div>
        <div class="stat-content">
          <div class="stat-value">{{ valueBets.length }}</div>
          <div class="stat-label">Value Bets</div>
          <div class="stat-detail">Top 20</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔗</div>
        <div class="stat-content">
          <div class="stat-value">{{ combinations.length }}</div>
          <div class="stat-label">Combinaisons</div>
          <div class="stat-detail">COUPLE & TRIO</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏇</div>
        <div class="stat-content">
          <div class="stat-value">{{ uniqueRaces }}</div>
          <div class="stat-label">Courses</div>
          <div class="stat-detail">Différentes</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement des paris stockés...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasBets" class="empty-state">
      <div class="empty-icon">📭</div>
      <h2>Aucun pari stocké pour cette date</h2>
      <p>Allez sur "🏆 Top Chevaux" ou "🥇 Top 5 du Jour" et cliquez sur "💾 Stocker les Paris"</p>
    </div>

    <!-- Tabs -->
    <div v-else class="tabs">
      <button
        :class="{ active: activeTab === 'daily' }"
        @click="activeTab = 'daily'"
      >
        Paris Quotidiens ({{ dailyBets.length }})
      </button>
      <button
        :class="{ active: activeTab === 'value' }"
        @click="activeTab = 'value'"
      >
        Value Bets ({{ valueBets.length }})
      </button>
      <button
        :class="{ active: activeTab === 'combinations' }"
        @click="activeTab = 'combinations'"
      >
        Combinaisons ({{ combinations.length }})
      </button>
    </div>

    <!-- Tab Content -->
    <div v-if="!loading && hasBets" class="tab-content">
      <!-- Daily Bets -->
      <div v-if="activeTab === 'daily'" class="bets-grid">
        <div v-for="bet in dailyBets" :key="bet.id" class="bet-card">
          <div class="bet-header">
            <span class="horse-name">{{ bet.horse_name }}</span>
            <span class="bet-id">#{{ bet.id }}</span>
          </div>
          <div class="bet-stats">
            <div class="stat">
              <span class="label">Probabilité</span>
              <span class="value">{{ (bet.probability * 100).toFixed(1) }}%</span>
            </div>
            <div class="stat">
              <span class="label">Cote</span>
              <span class="value">{{ bet.odds?.toFixed(2) || 'N/A' }}</span>
            </div>
            <div class="stat">
              <span class="label">Course</span>
              <span class="value">#{{ bet.race_id }}</span>
            </div>
          </div>
          <div class="bet-meta" v-if="bet.metadata">
            <span v-if="bet.metadata.hippodrome">📍 {{ bet.metadata.hippodrome }}</span>
            <span v-if="bet.metadata.distance">📏 {{ bet.metadata.distance }}m</span>
          </div>
          <div class="bet-footer">
            <span class="timestamp">{{ formatDate(bet.created_at) }}</span>
            <span class="status" :class="{ processed: bet.is_processed }">
              {{ bet.is_processed ? '✓ Traité' : '⏳ En attente' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Value Bets -->
      <div v-if="activeTab === 'value'" class="value-bets-list">
        <div v-for="bet in valueBets" :key="bet.id" class="value-bet-card">
          <div class="rank">{{ bet.ranking }}</div>
          <div class="bet-info">
            <div class="bet-header">
              <span class="horse-name">{{ bet.horse_name }}</span>
              <span class="bet-id">#{{ bet.id }}</span>
            </div>
            <div class="bet-metrics">
              <div class="metric">
                <span class="label">Probabilité</span>
                <span class="value">{{ (bet.estimated_probability * 100).toFixed(1) }}%</span>
              </div>
              <div class="metric">
                <span class="label">Cote</span>
                <span class="value">{{ bet.offered_odds.toFixed(2) }}</span>
              </div>
              <div class="metric highlight">
                <span class="label">Value Score</span>
                <span class="value">{{ bet.value_score.toFixed(3) }}</span>
              </div>
              <div class="metric">
                <span class="label">Course</span>
                <span class="value">#{{ bet.race_id }}</span>
              </div>
            </div>
            <div class="bet-footer">
              <span class="timestamp">{{ formatDate(bet.created_at) }}</span>
              <span class="status" :class="{ processed: bet.is_processed }">
                {{ bet.is_processed ? '✓ Traité' : '⏳ En attente' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Combinations -->
      <div v-if="activeTab === 'combinations'" class="combinations-grid">
        <div v-for="combo in combinations" :key="combo.id" class="combo-card">
          <div class="combo-header">
            <span class="combo-type">{{ combo.combination_type }}</span>
            <span class="combo-id">#{{ combo.id }}</span>
          </div>
          <div class="horses-list">
            <span v-for="(horse, index) in combo.horses" :key="index" class="horse-chip">
              {{ horse.horse_name }}
            </span>
          </div>
          <div class="combo-stats">
            <div class="stat">
              <span class="label">Prob. Combinée</span>
              <span class="value">{{ (combo.combined_probability * 100).toFixed(2) }}%</span>
            </div>
            <div class="stat">
              <span class="label">Course</span>
              <span class="value">#{{ combo.race_id }}</span>
            </div>
          </div>
          <div class="combo-footer">
            <span class="timestamp">{{ formatDate(combo.created_at) }}</span>
            <span class="status" :class="{ processed: combo.is_processed }">
              {{ combo.is_processed ? '✓ Traité' : '⏳ En attente' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { pmuApi } from '../services/pmuApi'

const selectedDate = ref(new Date().toISOString().split('T')[0])
const loading = ref(false)
const clearing = ref(false)
const activeTab = ref('daily')

const dailyBets = ref([])
const valueBets = ref([])
const combinations = ref([])

const hasBets = computed(() =>
  dailyBets.value.length > 0 || valueBets.value.length > 0 || combinations.value.length > 0
)

const uniqueRaces = computed(() => {
  const races = new Set()
  dailyBets.value.forEach(b => races.add(b.race_id))
  valueBets.value.forEach(b => races.add(b.race_id))
  combinations.value.forEach(c => races.add(c.race_id))
  return races.size
})

const loadStoredBets = async () => {
  loading.value = true

  try {
    // Load all three types
    const [dailyResponse, valueResponse, comboResponse] = await Promise.all([
      pmuApi.getDailyBets(selectedDate.value),
      pmuApi.getValueBets(selectedDate.value),
      pmuApi.getCombinations(selectedDate.value)
    ])

    dailyBets.value = dailyResponse.data || []
    valueBets.value = valueResponse.data || []
    combinations.value = comboResponse.data || []
  } catch (error) {
    console.error('Error loading stored bets:', error)
  } finally {
    loading.value = false
  }
}

const clearBets = async () => {
  if (!confirm(`Voulez-vous vraiment supprimer TOUS les paris du ${selectedDate.value} ?`)) {
    return
  }

  clearing.value = true

  try {
    // Note: You'll need to add a DELETE endpoint in the backend
    await fetch(`/api/pmu/betting/clear?date=${selectedDate.value}`, {
      method: 'DELETE'
    })

    await loadStoredBets()
  } catch (error) {
    console.error('Error clearing bets:', error)
    alert('Erreur lors de la suppression')
  } finally {
    clearing.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadStoredBets()
})
</script>

<style scoped>
.stored-bets-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  color: #1a1a1a;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #666;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

input[type="date"] {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.refresh-btn {
  padding: 0.5rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.refresh-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.clear-btn {
  padding: 0.5rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.clear-btn:hover:not(:disabled) {
  background: #dc2626;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
}

.stat-detail {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e5e5;
}

.tabs button {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.tabs button:hover {
  color: #1a1a1a;
}

.tabs button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.bets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.bet-card, .combo-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #2563eb;
}

.bet-header, .combo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.horse-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.bet-id, .combo-id {
  font-size: 0.875rem;
  color: #999;
}

.bet-stats, .combo-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat .label {
  font-size: 0.75rem;
  color: #666;
}

.stat .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.bet-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1rem;
}

.bet-footer, .combo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e5e5;
  font-size: 0.875rem;
}

.timestamp {
  color: #999;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #666;
}

.status.processed {
  background: #d1fae5;
  color: #065f46;
}

.value-bets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.value-bet-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  gap: 1rem;
  border-left: 4px solid #10b981;
}

.rank {
  width: 40px;
  height: 40px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.bet-info {
  flex: 1;
}

.bet-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric.highlight .value {
  color: #2563eb;
  font-weight: 700;
}

.combinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.combo-type {
  font-weight: 600;
  color: #2563eb;
}

.horses-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.horse-chip {
  padding: 0.25rem 0.75rem;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 0.875rem;
  color: #1a1a1a;
}
</style>