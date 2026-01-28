<template>
  <div class="betting-report-page">
    <header>
      <div class="header-content">
        <h1>Rapport de Paris</h1>
        <p class="subtitle">Analyse des performances quotidiennes</p>
      </div>
      <div class="controls">
        <input
          type="date"
          v-model="selectedDate"
          @change="loadReport"
        />
        <button @click="loadReport" :disabled="loading" class="refresh-btn">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Génération du rapport...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">!</div>
      <p>{{ error }}</p>
      <button @click="loadReport" class="retry-btn">Réessayer</button>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="report-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card summary-card">
          <h3>Paris du Jour</h3>
          <div class="stat-grid">
            <div class="stat">
              <span class="label">Paris Quotidiens</span>
              <span class="value">{{ report.summary.total_daily_bets }}</span>
            </div>
            <div class="stat">
              <span class="label">Value Bets</span>
              <span class="value">{{ report.summary.total_value_bets }}</span>
            </div>
            <div class="stat">
              <span class="label">Combinaisons</span>
              <span class="value">{{ report.summary.total_combinations }}</span>
            </div>
            <div class="stat">
              <span class="label">Courses</span>
              <span class="value">{{ report.summary.total_races_with_results }}</span>
            </div>
          </div>
        </div>

        <div class="card performance-card" :class="performanceClass">
          <h3>Performance</h3>
          <div class="stat-grid">
            <div class="stat">
              <span class="label">Paris Gagnants</span>
              <span class="value">{{ report.summary.winning_bets }}</span>
            </div>
            <div class="stat">
              <span class="label">Total Misé</span>
              <span class="value">{{ report.summary.total_invested }}€</span>
            </div>
            <div class="stat">
              <span class="label">Total Gains</span>
              <span class="value">{{ report.summary.total_returns.toFixed(2) }}€</span>
            </div>
            <div class="stat roi-stat">
              <span class="label">ROI</span>
              <span class="value roi-value">{{ report.summary.roi }}%</span>
            </div>
          </div>
          <div class="profit-display">
            <span class="label">Profit Net</span>
            <span class="value" :class="profitClass">
              {{ report.summary.net_profit > 0 ? '+' : '' }}{{ report.summary.net_profit.toFixed(2) }}€
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }} ({{ getTabCount(tab.id) }})
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Daily Bets Tab -->
        <div v-if="activeTab === 'daily'" class="bets-section">
          <h2>Paris Quotidiens (Probabilité > 40%)</h2>
          <div class="bets-grid">
            <div
              v-for="bet in report.daily_bets"
              :key="bet.id"
              class="bet-card"
              :class="{ won: bet.won, lost: !bet.won && bet.payout !== null }"
            >
              <div class="bet-header">
                <span class="horse-name">{{ bet.horse_name }}</span>
                <span class="status-badge" :class="{ won: bet.won }">
                  {{ bet.won ? '✓ GAGNÉ' : bet.payout !== null ? '✗ PERDU' : '⏳' }}
                </span>
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
                <div class="stat" v-if="bet.payout">
                  <span class="label">Rapport</span>
                  <span class="value gain">{{ bet.payout.toFixed(2) }}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Value Bets Tab -->
        <div v-if="activeTab === 'value'" class="bets-section">
          <h2>Top 20 Value Bets</h2>
          <div class="value-bets-list">
            <div
              v-for="bet in report.value_bets"
              :key="bet.id"
              class="value-bet-card"
              :class="{ won: bet.won, lost: !bet.won && bet.payout !== null }"
            >
              <div class="rank">{{ bet.ranking }}</div>
              <div class="bet-info">
                <div class="bet-header">
                  <span class="horse-name">{{ bet.horse_name }}</span>
                  <span class="status-badge" :class="{ won: bet.won }">
                    {{ bet.won ? '✓ GAGNÉ' : bet.payout !== null ? '✗ PERDU' : '⏳' }}
                  </span>
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
                  <div class="metric" v-if="bet.payout">
                    <span class="label">Rapport</span>
                    <span class="value gain">{{ bet.payout.toFixed(2) }}€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Combinations Tab -->
        <div v-if="activeTab === 'combinations'" class="bets-section">
          <h2>Combinaisons</h2>
          <div class="combinations-grid">
            <div
              v-for="combo in report.combinations"
              :key="combo.id"
              class="combo-card"
              :class="{ won: combo.won, lost: !combo.won && combo.payout !== null }"
            >
              <div class="combo-header">
                <span class="combo-type">{{ combo.combination_type }}</span>
                <span class="status-badge" :class="{ won: combo.won }">
                  {{ combo.won ? '✓ GAGNÉ' : combo.payout !== null ? '✗ PERDU' : '⏳' }}
                </span>
              </div>
              <div class="horses-list">
                <span
                  v-for="(horse, index) in combo.horses"
                  :key="index"
                  class="horse-chip"
                >
                  {{ horse.horse_name }}
                </span>
              </div>
              <div class="combo-stats">
                <div class="stat">
                  <span class="label">Prob. Combinée</span>
                  <span class="value">{{ (combo.combined_probability * 100).toFixed(2) }}%</span>
                </div>
                <div class="stat" v-if="combo.payout">
                  <span class="label">Rapport</span>
                  <span class="value gain">{{ combo.payout.toFixed(2) }}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Tab -->
        <div v-if="activeTab === 'results'" class="results-section">
          <h2>Résultats des Courses</h2>
          <div class="results-list">
            <div v-for="result in report.results" :key="result.race_id" class="result-card">
              <div class="result-header">
                <h3>{{ result.hippodrome }}</h3>
                <span class="race-number">Course {{ result.race_number }}</span>
              </div>
              <div class="podium">
                <div class="position gold">
                  <span class="rank">1</span>
                  <span class="horse">{{ result.winner?.horse_name || 'N/A' }}</span>
                </div>
                <div v-if="result.top_3[1]" class="position silver">
                  <span class="rank">2</span>
                  <span class="horse">{{ result.top_3[1].horse_name }}</span>
                </div>
                <div v-if="result.top_3[2]" class="position bronze">
                  <span class="rank">3</span>
                  <span class="horse">{{ result.top_3[2].horse_name }}</span>
                </div>
              </div>
              <div class="rapports">
                <h4>Rapports PMU</h4>
                <div class="rapport-grid">
                  <div v-for="(value, type) in result.rapports" :key="type" class="rapport-item">
                    <span class="type">{{ formatRapportType(type) }}</span>
                    <span class="value">{{ value.toFixed(2) }}€</span>
                  </div>
                </div>
              </div>
            </div>
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
const error = ref(null)
const report = ref(null)
const activeTab = ref('daily')

const tabs = [
  { id: 'daily', label: 'Paris Quotidiens' },
  { id: 'value', label: 'Value Bets' },
  { id: 'combinations', label: 'Combinaisons' },
  { id: 'results', label: 'Résultats' }
]

const performanceClass = computed(() => {
  if (!report.value) return ''
  const roi = report.value.summary.roi
  if (roi > 10) return 'excellent'
  if (roi > 0) return 'good'
  return 'poor'
})

const profitClass = computed(() => {
  if (!report.value) return ''
  return report.value.summary.net_profit > 0 ? 'profit' : 'loss'
})

const getTabCount = (tabId) => {
  if (!report.value) return 0
  switch (tabId) {
    case 'daily':
      return report.value.daily_bets?.length || 0
    case 'value':
      return report.value.value_bets?.length || 0
    case 'combinations':
      return report.value.combinations?.length || 0
    case 'results':
      return report.value.results?.length || 0
    default:
      return 0
  }
}

const formatRapportType = (type) => {
  const names = {
    'simple_gagnant': 'Simple Gagnant',
    'simple_place': 'Simple Placé',
    'couple': 'Couplé',
    'trio': 'Tiercé',
    'quarte': 'Quarté',
    'quinte': 'Quinté'
  }
  return names[type] || type
}

const loadReport = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await pmuApi.getBettingReport(selectedDate.value)
    report.value = response.data
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement du rapport'
    console.error('Error loading report:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Load today's report by default (change from yesterday)
  loadReport()
})
</script>

<style scoped>
.betting-report-page {
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

.refresh-btn, .retry-btn {
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

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading, .error-state {
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

.error-icon {
  width: 60px;
  height: 60px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card h3 {
  margin: 0 0 1rem;
  color: #1a1a1a;
  font-size: 1.2rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat .label {
  font-size: 0.875rem;
  color: #666;
}

.stat .value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.performance-card.excellent {
  border-left: 4px solid #10b981;
}

.performance-card.good {
  border-left: 4px solid #3b82f6;
}

.performance-card.poor {
  border-left: 4px solid #ef4444;
}

.roi-stat .roi-value {
  color: #10b981;
}

.profit-display {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profit-display .value {
  font-size: 1.75rem;
  font-weight: 700;
}

.profit-display .value.profit {
  color: #10b981;
}

.profit-display .value.loss {
  color: #ef4444;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e5e5;
}

.tab {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.tab:hover {
  color: #1a1a1a;
}

.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.bets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.bet-card, .combo-card, .result-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid #e5e5e5;
}

.bet-card.won, .combo-card.won {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.bet-card.lost, .combo-card.lost {
  border-left-color: #ef4444;
  background: #fef2f2;
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e5e5e5;
  color: #666;
}

.status-badge.won {
  background: #10b981;
  color: white;
}

.bet-stats, .bet-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.75rem;
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
  border-left: 4px solid #e5e5e5;
}

.value-bet-card.won {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.value-bet-card.lost {
  border-left-color: #ef4444;
  background: #fef2f2;
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

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric.highlight .value {
  color: #2563eb;
  font-weight: 700;
}

.gain {
  color: #10b981;
  font-weight: 600;
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

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.result-card {
  border-left: 4px solid #2563eb;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h3 {
  margin: 0;
  color: #1a1a1a;
}

.race-number {
  padding: 0.25rem 0.75rem;
  background: #2563eb;
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.podium {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.position {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.position.gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.position.silver {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
}

.position.bronze {
  background: linear-gradient(135deg, #cd7f32 0%, #e9b872 100%);
}

.position .rank {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.position .horse {
  display: block;
  font-weight: 600;
}

.rapports h4 {
  margin: 0 0 1rem;
  color: #1a1a1a;
}

.rapport-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
}

.rapport-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
}

.rapport-item .type {
  font-size: 0.875rem;
  color: #666;
}

.rapport-item .value {
  font-weight: 600;
  color: #10b981;
}
</style>