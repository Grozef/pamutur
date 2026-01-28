<template>
  <div class="top5-page">
    <header>
      <div class="header-content">
        <h1>Top 5 Paris du Jour</h1>
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
        <button
          @click="storeBets"
          :disabled="loading || storing || !topBets?.top_bets?.length"
          class="store-btn"
        >
          {{ storing ? '💾 Stockage...' : '💾 Stocker les Paris' }}
        </button>
      </div>
    </header>

    <!-- Store Success Message -->
    <div v-if="storeResult" class="store-result success">
      <span class="close-btn" @click="storeResult = null">✕</span>
      <h3>✓ Paris stockés avec succès !</h3>
      <div class="store-stats">
        <span>{{ storeResult.daily_bets_stored }} paris quotidiens</span>
        <span>{{ storeResult.value_bets_stored }} value bets</span>
        <span>{{ storeResult.combinations_created }} combinaisons</span>
      </div>
    </div>

    <!-- Store Error Message -->
    <div v-if="storeError" class="store-result error">
      <span class="close-btn" @click="storeError = null">✕</span>
      <h3>✗ Erreur</h3>
      <p>{{ storeError }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Analyse des courses en cours...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">!</div>
      <p>{{ error }}</p>
      <button @click="loadTopBets" class="retry-btn">Réessayer</button>
    </div>

    <!-- Empty State - FIX: Safe access with optional chaining -->
    <div v-else-if="topBets && (!topBets.top_bets || topBets.top_bets.length === 0)" class="empty-state">
      <div class="empty-icon">?</div>
      <h2>Aucun value bet trouvé</h2>
      <p>Aucune course avec des value bets n'a été trouvée pour cette date.</p>
      <p class="hint">Astuce: Essayez une autre date ou lancez <code>php artisan pmu:fetch</code></p>
    </div>

    <!-- Content - FIX: Additional safety checks -->
    <div v-else-if="topBets && topBets.top_bets && topBets.top_bets.length > 0" class="content">
      <!-- Summary Cards - FIX: Safe access with defaults -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-icon">Stats</div>
          <div class="summary-content">
            <div class="summary-value">{{ topBets.races_count || 0 }}</div>
            <div class="summary-label">Courses analysées</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon">€</div>
          <div class="summary-content">
            <div class="summary-value">{{ getSummaryValue('total_stake', 0) }}€</div>
            <div class="summary-label">Mise totale</div>
          </div>
        </div>

        <div class="summary-card highlight">
          <div class="summary-icon">+</div>
          <div class="summary-content">
            <div class="summary-value">+{{ formatNumber(getSummaryValue('total_expected_value', 0)) }}%</div>
            <div class="summary-label">Expected Value</div>
          </div>
        </div>

        <div class="summary-card roi">
          <div class="summary-icon">ROI</div>
          <div class="summary-content">
            <div class="summary-value">{{ formatNumber(getSummaryValue('estimated_roi', 0), 0) }}%</div>
            <div class="summary-label">ROI Estimé</div>
          </div>
        </div>
      </div>

      <!-- Top 5 Bets -->
      <div class="top-bets-container">
        <h2 class="section-title">
          <span class="medal">1st</span>
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
                  <h3 class="horse-name">{{ bet.horse_name || 'N/A' }}</h3>
                  <div class="race-info">
                    <span class="badge race-badge">{{ bet.race_code || 'N/A' }}</span>
                    <span class="info">{{ bet.hippodrome || 'N/A' }}</span>
                    <span class="info">{{ bet.race_time || 'N/A' }}</span>
                    <span class="info">{{ bet.distance || 0 }}m</span>
                    <span class="discipline-badge">{{ bet.discipline || 'N/A' }}</span>
                  </div>
                </div>

                <div class="probability-badge" :class="getProbabilityClass(bet.probability || 0)">
                  {{ formatNumber(bet.probability || 0) }}%
                </div>
              </div>

              <!-- Stats Grid - FIX: Safe access to nested properties -->
              <div class="stats-grid">
                <div class="stat">
                  <div class="stat-label">Cote</div>
                  <div class="stat-value odds">{{ formatNumber(bet.odds || 0) }}</div>
                </div>

                <div class="stat highlight-stat">
                  <div class="stat-label">Mise Kelly</div>
                  <div class="stat-value kelly">{{ formatNumber(getKellyValue(bet, 'recommended_stake'), 0) }}€</div>
                </div>

                <div class="stat highlight-stat">
                  <div class="stat-label">Expected Value</div>
                  <div class="stat-value ev">+{{ formatNumber(getKellyValue(bet, 'expected_value')) }}%</div>
                </div>

                <div class="stat">
                  <div class="stat-label">ROI Attendu</div>
                  <div class="stat-value roi">{{ formatNumber(getKellyValue(bet, 'roi_per_bet'), 0) }}%</div>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="additional-info">
                <div v-if="bet.jockey_name" class="info-item">
                  <span class="info-icon">J</span>
                  <span>{{ bet.jockey_name }}</span>
                </div>
                <div v-if="bet.draw" class="info-item">
                  <span class="info-icon">#</span>
                  <span>Corde {{ bet.draw }}</span>
                </div>
                <div v-if="bet.in_top_group" class="info-item badge-item">
                  <span class="group-badge">TOP GROUPE</span>
                </div>
              </div>

              <!-- Manual Bet Input -->
              <div class="manual-bet-section">
                <h4>Ajouter ce pari</h4>
                <div class="manual-bet-inputs">
                  <input
                    type="number"
                    v-model.number="bet.manualAmount"
                    placeholder="Montant €"
                    min="0"
                    step="0.5"
                    class="amount-input"
                  />
                  <select v-model="bet.betType" class="bet-type-select">
                    <option value="SIMPLE">Simple</option>
                    <option value="COUPLE_PLACE">Couplé Placé</option>
                  </select>
                  <button
                    @click="addManualBet(bet)"
                    :disabled="!bet.manualAmount || bet.manualAmount <= 0 || addingBet"
                    class="add-bet-btn"
                  >
                    {{ addingBet ? '...' : '➕ Ajouter' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Manual Bets List -->
      <div class="manual-bets-container" v-if="manualBets.length > 0">
        <h2 class="section-title">
          <span class="medal">📋</span>
          Paris Ajoutés ({{ manualBets.length }})
        </h2>
        <div class="manual-bets-list">
          <div v-for="bet in manualBets" :key="bet.id" class="manual-bet-card">
            <div class="manual-bet-header">
              <span class="horse-name">{{ bet.horse_name }}</span>
              <span class="bet-amount">{{ bet.amount }}€</span>
            </div>
            <div class="manual-bet-details">
              <span class="bet-type-badge">{{ bet.bet_type }}</span>
              <span class="bet-date">{{ formatDate(bet.created_at) }}</span>
            </div>
            <button @click="deleteManualBet(bet.id)" class="delete-btn">🗑️</button>
          </div>
        </div>
        <div class="manual-bets-total">
          <strong>Total Misé:</strong> {{ totalManualBets }}€
        </div>
      </div>

      <!-- Additional Info -->
      <div class="info-section">
        <div class="info-card">
          <h3>Comment utiliser ces informations</h3>
          <ul>
            <li><strong>Expected Value (EV)</strong> : Gain moyen attendu en pourcentage. Un EV positif indique un pari rentable à long terme.</li>
            <li><strong>Kelly Criterion</strong> : Formule mathématique qui calcule la mise optimale pour maximiser les gains tout en minimisant le risque de ruine.</li>
            <li><strong>ROI Attendu</strong> : Retour sur investissement estimé pour ce pari spécifique.</li>
            <li><strong>Probabilité</strong> : Notre estimation basée sur l'analyse de multiples facteurs (forme, classe, jockey, conditions).</li>
          </ul>
        </div>

        <div class="info-card warning">
          <h3>Avertissement</h3>
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
import { ref, computed, onMounted } from 'vue';
import { useDailyBets } from '../composables/useDailyBets';
import { pmuApi } from '../services/pmuApi';

const { topBets, loading, error, fetchTopBets } = useDailyBets();

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const bankroll = ref(1000);
const storing = ref(false);
const storeResult = ref(null);
const storeError = ref(null);
const addingBet = ref(false);
const manualBets = ref([]);

const loadTopBets = async () => {
  await fetchTopBets(selectedDate.value, bankroll.value, 5);
  // Initialize manualAmount and betType for each bet
  if (topBets.value?.top_bets) {
    topBets.value.top_bets.forEach(bet => {
      bet.manualAmount = null;
      bet.betType = 'SIMPLE';
    });
  }
  // Load manual bets for this date
  await loadManualBets();
};

const loadManualBets = async () => {
  try {
    const response = await fetch(`/api/pmu/betting/manual-bets?date=${selectedDate.value}`);
    if (response.ok) {
      const data = await response.json();
      manualBets.value = data.data || [];
    }
  } catch (err) {
    console.error('Error loading manual bets:', err);
  }
};

const addManualBet = async (bet) => {
  if (!bet.manualAmount || bet.manualAmount <= 0) return;

  addingBet.value = true;

  try {
    const response = await fetch('/api/pmu/betting/manual-bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet_date: selectedDate.value,
        horse_id: bet.horse_id,
        horse_name: bet.horse_name,
        amount: bet.manualAmount,
        bet_type: bet.betType,
        probability: bet.probability / 100,
        odds: bet.odds,
        metadata: {
          race_id: bet.race_id,
          hippodrome: bet.hippodrome,
          discipline: bet.discipline
        }
      })
    });

    if (!response.ok) throw new Error('Erreur lors de l\'ajout');

    // Reset form
    bet.manualAmount = null;
    bet.betType = 'SIMPLE';

    // Reload manual bets
    await loadManualBets();

    // Show success message
    storeResult.value = { message: 'Pari ajouté avec succès!' };
    setTimeout(() => { storeResult.value = null; }, 2000);
  } catch (err) {
    storeError.value = err.message;
    setTimeout(() => { storeError.value = null; }, 3000);
  } finally {
    addingBet.value = false;
  }
};

const deleteManualBet = async (betId) => {
  if (!confirm('Supprimer ce pari ?')) return;

  try {
    const response = await fetch(`/api/pmu/betting/manual-bets/${betId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Erreur lors de la suppression');

    await loadManualBets();
  } catch (err) {
    console.error('Error deleting bet:', err);
    alert('Erreur lors de la suppression');
  }
};

const totalManualBets = computed(() => {
  return manualBets.value.reduce((sum, bet) => sum + parseFloat(bet.amount), 0).toFixed(2);
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const storeBets = async () => {
  if (!topBets.value?.top_bets?.length) {
    storeError.value = 'Aucun pari à stocker';
    return;
  }

  storing.value = true;
  storeResult.value = null;
  storeError.value = null;

  try {
    // Formater tous les paris (top bets + all bets)
    const predictions = [];

    // Ajouter les top bets
    if (topBets.value.top_bets) {
      topBets.value.top_bets.forEach(bet => {
        predictions.push({
          race_id: bet.race_id,
          horse_id: bet.horse_id,
          horse_name: bet.horse_name,
          probability: bet.probability / 100, // Convertir % en décimal
          odds: bet.odds,
          metadata: {
            kelly_fraction: bet.kelly_data?.kelly_fraction,
            expected_value: bet.kelly_data?.expected_value,
            suggested_bet: bet.kelly_data?.suggested_bet,
            hippodrome: bet.hippodrome,
            distance: bet.distance,
            discipline: bet.discipline
          }
        });
      });
    }

    // Ajouter les autres paris si disponibles
    if (topBets.value.all_bets) {
      topBets.value.all_bets.forEach(bet => {
        // Ne pas ajouter de doublons
        if (!predictions.find(p => p.horse_id === bet.horse_id && p.race_id === bet.race_id)) {
          predictions.push({
            race_id: bet.race_id,
            horse_id: bet.horse_id,
            horse_name: bet.horse_name,
            probability: bet.probability / 100,
            odds: bet.odds,
            metadata: {
              hippodrome: bet.hippodrome,
              distance: bet.distance
            }
          });
        }
      });
    }

    const response = await pmuApi.processPredictions(selectedDate.value, predictions);
    storeResult.value = response.data;

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      storeResult.value = null;
    }, 5000);
  } catch (err) {
    console.error('Error storing bets:', err);
    storeError.value = err.message || 'Erreur lors du stockage des paris';
  } finally {
    storing.value = false;
  }
};

// FIX: Safe access helper for summary values
const getSummaryValue = (key, defaultValue = 0) => {
  return topBets.value?.summary?.[key] ?? defaultValue;
};

// FIX: Safe access helper for kelly_data
const getKellyValue = (bet, key, defaultValue = 0) => {
  return bet?.kelly_data?.[key] ?? defaultValue;
};

// FIX: Safe number formatting
const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return Number(value).toFixed(decimals);
};

const getRankClass = (index) => {
  if (index === 0) return 'rank-1';
  if (index === 1) return 'rank-2';
  if (index === 2) return 'rank-3';
  return 'rank-other';
};

const getRankEmoji = (index) => {
  const emojis = ['1st', '2nd', '3rd', '4th', '5th'];
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
  font-size: 48px;
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
  font-size: 24px;
  font-weight: bold;
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
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
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
  font-size: 12px;
  color: white;
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
  font-size: 14px;
  font-weight: bold;
  color: #7f8c8d;
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

/* Store Button */
.store-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
}

.store-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
}

/* Store Result Messages */
.store-result {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  animation: slideDown 0.3s ease-out;
}

.store-result.success {
  background: linear-gradient(135deg, #d1fae5 0%, white 100%);
  border: 2px solid #10b981;
}

.store-result.error {
  background: linear-gradient(135deg, #fee2e2 0%, white 100%);
  border: 2px solid #ef4444;
}

.store-result h3 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #2c3e50;
}

.store-result p {
  margin: 0;
  color: #34495e;
}

.store-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 15px;
  font-weight: 600;
  color: #059669;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  cursor: pointer;
  font-size: 24px;
  color: #7f8c8d;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #2c3e50;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Manual Bet Section */
.manual-bet-section {
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #f0f9ff 0%, white 100%);
  border-radius: 12px;
  border: 2px solid #2563eb;
}

.manual-bet-section h4 {
  margin: 0 0 10px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
}

.manual-bet-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
}

.amount-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
}

.bet-type-select {
  padding: 8px 12px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  background: white;
  cursor: pointer;
}

.add-bet-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.add-bet-btn:hover:not(:disabled) {
  background: #059669;
}

.add-bet-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Manual Bets Container */
.manual-bets-container {
  margin-top: 40px;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.manual-bets-list {
  display: grid;
  gap: 15px;
  margin-bottom: 20px;
}

.manual-bet-card {
  background: linear-gradient(135deg, #f0f9ff 0%, white 100%);
  border: 2px solid #2563eb;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manual-bet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  margin-right: 15px;
}

.manual-bet-header .horse-name {
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
}

.manual-bet-header .bet-amount {
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
}

.manual-bet-details {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-right: 15px;
}

.bet-type-badge {
  padding: 4px 12px;
  background: #2563eb;
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.bet-date {
  font-size: 12px;
  color: #666;
}

.delete-btn {
  padding: 8px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.delete-btn:hover {
  background: #dc2626;
}

.manual-bets-total {
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: right;
  font-size: 18px;
  color: #1a1a1a;
}

.manual-bets-total strong {
  color: #10b981;
}
</style>