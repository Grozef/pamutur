<template>
  <div class="top5-page">
    <header>
      <div class="header-content">
        <h1>🏆 Top 5 Paris du Jour</h1>
        <p class="subtitle">Les meilleurs value bets selon Kelly Criterion</p>
      </div>
      <div class="controls">
        <input
          type="date"
          v-model="selectedDate"
          @change="loadTopBets"
        />
        <label class="bankroll-input">
          Bankroll:
          <input
            type="number"
            v-model.number="bankroll"
            min="100"
            step="100"
          />€
        </label>
        <button @click="loadTopBets" :disabled="loading" class="refresh-btn">
          {{ loading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Analyse des courses en cours...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadTopBets" class="retry-btn">Réessayer</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="topBets && topBets.top_bets.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h2>Aucun value bet trouvé</h2>
      <p>Aucune course avec des value bets n'a été trouvée pour cette date.</p>
      <p class="hint">Astuce: Essayez une autre date ou lancez <code>php artisan pmu:fetch</code></p>
    </div>

    <!-- Content -->
    <div v-else-if="topBets" class="content">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <div class="summary-value">{{ topBets.races_count }}</div>
            <div class="summary-label">Courses analysées</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">💰</div>
          <div class="summary-content">
            <div class="summary-value">{{ topBets.summary.total_stake }}€</div>
            <div class="summary-label">Mise totale</div>
          </div>
        </div>

        <div class="summary-card highlight">
          <div class="summary-icon">📈</div>
          <div class="summary-content">
            <div class="summary-value">+{{ topBets.summary.total_expected_value.toFixed(1) }}%</div>
            <div class="summary-label">Expected Value</div>
          </div>
        </div>

        <div class="summary-card roi">
          <div class="summary-icon">🎯</div>
          <div class="summary-content">
            <div class="summary-value">{{ topBets.summary.estimated_roi.toFixed(0) }}%</div>
            <div class="summary-label">ROI Estimé</div>
          </div>
        </div>
      </div>

      <!-- Top 5 Bets -->
      <div class="top-bets-container">
        <h2 class="section-title">
          <span class="medal">🥇</span>
          Top {{ topBets.top_bets.length }} Value Bets
        </h2>

        <div class="bets-list">
          <div
            v-for="(bet, index) in topBets.top_bets"
            :key="`${bet.race_id}-${bet.horse_id}`"
            class="bet-card"
            :class="getRankClass(index)"
          >
            <!-- Rank Badge -->
            <div class="rank-badge" :class="getRankClass(index)">
              <span class="rank-number">{{ index + 1 }}</span>
              <span class="rank-emoji">{{ getRankEmoji(index) }}</span>
            </div>

            <!-- Main Content -->
            <div class="bet-content">
              <!-- Header -->
              <div class="bet-header">
                <div class="horse-info">
                  <h3 class="horse-name">{{ bet.horse_name }}</h3>
                  <div class="race-info">
                    <span class="badge race-badge">{{ bet.race_code }}</span>
                    <span class="info">{{ bet.hippodrome }}</span>
                    <span class="info">⏰ {{ bet.race_time }}</span>
                    <span class="info">{{ bet.distance }}m</span>
                    <span class="discipline-badge">{{ bet.discipline }}</span>
                  </div>
                </div>

                <div class="probability-badge" :class="getProbabilityClass(bet.probability)">
                  {{ bet.probability.toFixed(1) }}%
                </div>
              </div>

              <!-- Stats Grid -->
              <div class="stats-grid">
                <div class="stat">
                  <div class="stat-label">Cote</div>
                  <div class="stat-value odds">{{ bet.odds.toFixed(1) }}</div>
                </div>

                <div class="stat highlight-stat">
                  <div class="stat-label">Mise Kelly</div>
                  <div class="stat-value kelly">{{ bet.kelly_data.recommended_stake.toFixed(0) }}€</div>
                </div>

                <div class="stat highlight-stat">
                  <div class="stat-label">Expected Value</div>
                  <div class="stat-value ev">+{{ bet.kelly_data.expected_value.toFixed(1) }}%</div>
                </div>

                <div class="stat">
                  <div class="stat-label">ROI Attendu</div>
                  <div class="stat-value roi">{{ bet.kelly_data.roi_per_bet.toFixed(0) }}%</div>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="additional-info">
                <div v-if="bet.jockey_name" class="info-item">
                  <span class="info-icon">👤</span>
                  <span>{{ bet.jockey_name }}</span>
                </div>
                <div v-if="bet.draw" class="info-item">
                  <span class="info-icon">🎯</span>
                  <span>Corde {{ bet.draw }}</span>
                </div>
                <div v-if="bet.in_top_group" class="info-item badge-item">
                  <span class="group-badge">TOP GROUPE</span>
                </div>
              </div>

              <!-- Kelly Explanation -->
              <div class="kelly-explanation">
                <p>
                  💡 Kelly Criterion recommande de miser
                  <strong>{{ bet.kelly_data.kelly_fraction.toFixed(2) }}%</strong> de votre bankroll
                  ({{ bet.kelly_data.recommended_stake.toFixed(0) }}€ sur {{ bankroll }}€)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="info-section">
        <div class="info-card">
          <h3>💡 Comment utiliser ces informations</h3>
          <ul>
            <li><strong>Expected Value (EV)</strong> : Gain moyen attendu en pourcentage. Un EV positif indique un pari rentable à long terme.</li>
            <li><strong>Kelly Criterion</strong> : Formule mathématique qui calcule la mise optimale pour maximiser les gains tout en minimisant le risque de ruine.</li>
            <li><strong>ROI Attendu</strong> : Retour sur investissement estimé pour ce pari spécifique.</li>
            <li><strong>Probabilité</strong> : Notre estimation basée sur l'analyse de multiples facteurs (forme, classe, jockey, conditions).</li>
          </ul>
        </div>

        <div class="info-card warning">
          <h3>⚠️ Avertissement</h3>
          <p>
            Ces prédictions sont basées sur des analyses statistiques et ne garantissent pas de gains.
            Les paris hippiques comportent des risques. Jouez de manière responsable et ne misez
            que ce que vous pouvez vous permettre de perdre.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDailyBets } from '../composables/useDailyBets';

const { topBets, loading, error, fetchTopBets } = useDailyBets();

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const bankroll = ref(1000);

const loadTopBets = async () => {
  await fetchTopBets(selectedDate.value, bankroll.value, 5);
};

const getRankClass = (index) => {
  if (index === 0) return 'rank-1';
  if (index === 1) return 'rank-2';
  if (index === 2) return 'rank-3';
  return 'rank-other';
};

const getRankEmoji = (index) => {
  const emojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  return emojis[index] || '';
};

const getProbabilityClass = (probability) => {
  if (probability >= 30) return 'very-high';
  if (probability >= 20) return 'high';
  if (probability >= 10) return 'medium';
  return 'low';
};

onMounted(() => {
  loadTopBets();
});
</script>

<style scoped>
.top5-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

header {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.header-content h1 {
  margin: 0 0 5px 0;
  font-size: 32px;
  color: #2c3e50;
}

.subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 16px;
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

input[type="date"],
input[type="number"] {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.3s;
}

input[type="date"]:focus,
input[type="number"]:focus {
  outline: none;
  border-color: #667eea;
}

.bankroll-input {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #2c3e50;
}

.bankroll-input input {
  width: 120px;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  background: white;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state, .empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px;
  text-align: center;
}

.error-icon, .empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state .hint {
  color: #7f8c8d;
  margin-top: 20px;
}

code {
  background: #f4f4f4;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.summary-card:hover {
  transform: translateY(-5px);
}

.summary-card.highlight {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
}

.summary-card.roi {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.summary-icon {
  font-size: 40px;
}

.summary-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 14px;
  opacity: 0.8;
}

.top-bets-container {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 30px 0;
  font-size: 24px;
  color: #2c3e50;
}

.medal {
  font-size: 32px;
}

.bets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bet-card {
  background: linear-gradient(to right, #f8f9fa 0%, white 100%);
  border-radius: 12px;
  padding: 25px;
  display: flex;
  gap: 20px;
  border-left: 5px solid #ddd;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.bet-card:hover {
  transform: translateX(5px);
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.bet-card.rank-1 {
  border-left-color: #ffd700;
  background: linear-gradient(to right, #fff9e6 0%, white 100%);
}

.bet-card.rank-2 {
  border-left-color: #c0c0c0;
  background: linear-gradient(to right, #f5f5f5 0%, white 100%);
}

.bet-card.rank-3 {
  border-left-color: #cd7f32;
  background: linear-gradient(to right, #fff5e6 0%, white 100%);
}

.rank-badge {
  background: #e0e0e0;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #e89e62 100%);
}

.rank-number {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.rank-emoji {
  font-size: 20px;
}

.bet-content {
  flex: 1;
}

.bet-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 20px;
}

.horse-name {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #2c3e50;
}

.race-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.badge {
  background: #e74c3c;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
}

.discipline-badge {
  background: #3498db;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
}

.info {
  color: #7f8c8d;
  font-size: 14px;
}

.probability-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 18px;
  color: white;
}

.probability-badge.very-high { background: #c62828; }
.probability-badge.high { background: #f57c00; }
.probability-badge.medium { background: #2196f3; }
.probability-badge.low { background: #757575; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat.highlight-stat {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4caf50;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-value.ev {
  color: #4caf50;
}

.stat-value.kelly {
  color: #2196f3;
}

.additional-info {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #2c3e50;
}

.info-icon {
  font-size: 16px;
}

.group-badge {
  background: #ff9800;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
}

.kelly-explanation {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.kelly-explanation p {
  margin: 0;
  font-size: 14px;
  color: #1976d2;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.info-card.warning {
  background: linear-gradient(135deg, #fff3e0 0%, white 100%);
  border-left: 4px solid #ff9800;
}

.info-card h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.info-card ul {
  margin: 0;
  padding-left: 20px;
}

.info-card li {
  margin-bottom: 10px;
  color: #34495e;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>