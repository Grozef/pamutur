<template>
  <div class="manual-kelly-page">
    <header>
      <h1>🎯 Paris Kelly Manuels</h1>
      <p class="subtitle">Ajouter des paris Kelly Criterion un par un avec montant personnalisé</p>
    </header>

    <!-- Add Bet Form -->
    <div class="add-bet-form">
      <h2>Ajouter un Paris Kelly</h2>
      
      <div class="form-grid">
        <div class="form-group">
          <label>Date</label>
          <input type="date" v-model="form.bet_date" />
        </div>

        <div class="form-group">
          <label>Race ID</label>
          <input type="number" v-model.number="form.race_id" placeholder="Ex: 1" />
        </div>

        <div class="form-group">
          <label>Horse ID</label>
          <input type="text" v-model="form.horse_id" placeholder="Ex: H123" />
        </div>

        <div class="form-group">
          <label>Nom du Cheval</label>
          <input type="text" v-model="form.horse_name" placeholder="Ex: Champion" />
        </div>

        <div class="form-group">
          <label>Probabilité (%)</label>
          <input 
            type="number" 
            v-model.number="form.probability" 
            min="0" 
            max="100" 
            step="0.1"
            @input="calculateKelly"
            placeholder="Ex: 45.5"
          />
        </div>

        <div class="form-group">
          <label>Cote</label>
          <input 
            type="number" 
            v-model.number="form.odds" 
            min="1" 
            step="0.01"
            @input="calculateKelly"
            placeholder="Ex: 3.50"
          />
        </div>

        <div class="form-group">
          <label>Bankroll (€)</label>
          <input 
            type="number" 
            v-model.number="form.bankroll" 
            min="0" 
            step="10"
            @input="calculateBetAmount"
            placeholder="Ex: 1000"
          />
        </div>

        <div class="form-group highlight">
          <label>Kelly Fraction (%)</label>
          <input 
            type="number" 
            v-model.number="kellyFraction" 
            readonly
            class="readonly"
          />
        </div>

        <div class="form-group highlight">
          <label>Montant Suggéré (€)</label>
          <input 
            type="number" 
            v-model.number="suggestedAmount" 
            readonly
            class="readonly"
          />
        </div>

        <div class="form-group">
          <label>Montant à Miser (€)</label>
          <input 
            type="number" 
            v-model.number="form.bet_amount" 
            min="0" 
            step="0.5"
            placeholder="Personnalisé"
          />
        </div>
      </div>

      <!-- Kelly Info -->
      <div class="kelly-info" v-if="kellyFraction > 0">
        <h3>📊 Analyse Kelly</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Kelly Fraction:</span>
            <span class="value">{{ kellyFraction.toFixed(2) }}%</span>
          </div>
          <div class="info-item">
            <span class="label">Edge:</span>
            <span class="value">{{ edge.toFixed(2) }}%</span>
          </div>
          <div class="info-item">
            <span class="label">Expected Value:</span>
            <span class="value" :class="{ positive: expectedValue > 0, negative: expectedValue < 0 }">
              {{ expectedValue > 0 ? '+' : '' }}{{ expectedValue.toFixed(2) }}€
            </span>
          </div>
          <div class="info-item">
            <span class="label">ROI Espéré:</span>
            <span class="value">{{ ((form.probability * form.odds - 1) * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button @click="addBet" :disabled="!isFormValid || adding" class="add-btn">
          {{ adding ? 'Ajout...' : '➕ Ajouter le Pari' }}
        </button>
        <button @click="resetForm" class="reset-btn">
          🔄 Réinitialiser
        </button>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="message" class="message" :class="messageType">
        {{ message }}
      </div>
    </div>

    <!-- Existing Kelly Bets List -->
    <div class="kelly-bets-list">
      <div class="list-header">
        <h2>Paris Kelly Enregistrés ({{ kellyBets.length }})</h2>
        <div class="controls">
          <input type="date" v-model="selectedDate" @change="loadKellyBets" />
          <button @click="loadKellyBets" :disabled="loading">
            {{ loading ? 'Chargement...' : 'Actualiser' }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="kellyBets.length === 0" class="empty-state">
        <p>Aucun pari Kelly pour cette date</p>
      </div>

      <!-- Bets Grid -->
      <div v-else class="bets-grid">
        <div v-for="bet in kellyBets" :key="bet.id" class="kelly-bet-card">
          <div class="bet-header">
            <span class="horse-name">{{ bet.horse_name }}</span>
            <span class="bet-amount">{{ bet.bet_amount }}€</span>
          </div>
          <div class="bet-details">
            <div class="detail">
              <span class="label">Probabilité:</span>
              <span class="value">{{ (bet.probability * 100).toFixed(1) }}%</span>
            </div>
            <div class="detail">
              <span class="label">Cote:</span>
              <span class="value">{{ bet.odds.toFixed(2) }}</span>
            </div>
            <div class="detail">
              <span class="label">Kelly:</span>
              <span class="value">{{ (bet.kelly_fraction * 100).toFixed(2) }}%</span>
            </div>
            <div class="detail">
              <span class="label">Bankroll:</span>
              <span class="value">{{ bet.bankroll }}€</span>
            </div>
          </div>
          <div class="bet-footer">
            <span class="race-info">Course #{{ bet.race_id }}</span>
            <span class="status" :class="{ processed: bet.is_processed }">
              {{ bet.is_processed ? '✓ Traité' : '⏳ En attente' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Total -->
      <div v-if="kellyBets.length > 0" class="total-card">
        <div class="total-item">
          <span class="label">Total Misé:</span>
          <span class="value">{{ totalBetAmount.toFixed(2) }}€</span>
        </div>
        <div class="total-item">
          <span class="label">Moyenne Kelly:</span>
          <span class="value">{{ averageKelly.toFixed(2) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const form = ref({
  bet_date: new Date().toISOString().split('T')[0],
  race_id: null,
  horse_id: '',
  horse_name: '',
  probability: null,
  odds: null,
  bankroll: 1000,
  bet_amount: null
})

const kellyFraction = ref(0)
const suggestedAmount = ref(0)
const adding = ref(false)
const loading = ref(false)
const message = ref('')
const messageType = ref('success')

const kellyBets = ref([])
const selectedDate = ref(new Date().toISOString().split('T')[0])

const edge = computed(() => {
  if (!form.value.probability || !form.value.odds) return 0
  return (form.value.probability / 100 * form.value.odds - 1) * 100
})

const expectedValue = computed(() => {
  if (!form.value.bet_amount || !form.value.probability || !form.value.odds) return 0
  return form.value.bet_amount * (form.value.probability / 100 * form.value.odds - 1)
})

const isFormValid = computed(() => {
  return form.value.race_id &&
         form.value.horse_id &&
         form.value.horse_name &&
         form.value.probability > 0 &&
         form.value.odds > 1 &&
         form.value.bankroll > 0 &&
         form.value.bet_amount > 0
})

const totalBetAmount = computed(() => {
  return kellyBets.value.reduce((sum, bet) => sum + parseFloat(bet.bet_amount), 0)
})

const averageKelly = computed(() => {
  if (kellyBets.value.length === 0) return 0
  const sum = kellyBets.value.reduce((total, bet) => total + bet.kelly_fraction, 0)
  return (sum / kellyBets.value.length) * 100
})

const calculateKelly = () => {
  if (!form.value.probability || !form.value.odds || form.value.odds <= 1) {
    kellyFraction.value = 0
    suggestedAmount.value = 0
    return
  }

  const prob = form.value.probability / 100
  const odds = form.value.odds

  // Kelly formula: (prob * odds - 1) / (odds - 1)
  const kelly = (prob * odds - 1) / (odds - 1)
  kellyFraction.value = Math.max(0, Math.min(100, kelly * 100))

  calculateBetAmount()
}

const calculateBetAmount = () => {
  if (!form.value.bankroll || kellyFraction.value === 0) {
    suggestedAmount.value = 0
    return
  }

  suggestedAmount.value = (form.value.bankroll * kellyFraction.value / 100)
  
  // Auto-set bet amount if not manually changed
  if (!form.value.bet_amount || form.value.bet_amount === 0) {
    form.value.bet_amount = suggestedAmount.value
  }
}

const addBet = async () => {
  if (!isFormValid.value) return

  adding.value = true
  message.value = ''

  try {
    const response = await fetch('/api/pmu/betting/kelly-bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        probability: form.value.probability / 100, // Convert to decimal
        kelly_fraction: kellyFraction.value / 100
      })
    })

    if (!response.ok) throw new Error('Erreur lors de l\'ajout')

    message.value = '✓ Pari Kelly ajouté avec succès !'
    messageType.value = 'success'

    resetForm()
    await loadKellyBets()

    setTimeout(() => { message.value = '' }, 3000)
  } catch (error) {
    message.value = '✗ ' + error.message
    messageType.value = 'error'
  } finally {
    adding.value = false
  }
}

const resetForm = () => {
  form.value = {
    bet_date: new Date().toISOString().split('T')[0],
    race_id: null,
    horse_id: '',
    horse_name: '',
    probability: null,
    odds: null,
    bankroll: 1000,
    bet_amount: null
  }
  kellyFraction.value = 0
  suggestedAmount.value = 0
}

const loadKellyBets = async () => {
  loading.value = true

  try {
    const response = await fetch(`/api/pmu/betting/kelly-bets?date=${selectedDate.value}`)
    if (!response.ok) throw new Error('Erreur de chargement')

    const data = await response.json()
    kellyBets.value = data.data || []
  } catch (error) {
    console.error('Error loading Kelly bets:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadKellyBets()
})
</script>

<style scoped>
.manual-kelly-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

header {
  margin-bottom: 2rem;
}

header h1 {
  margin: 0;
  font-size: 2rem;
  color: #1a1a1a;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #666;
}

.add-bet-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.add-bet-form h2 {
  margin: 0 0 1.5rem;
  color: #1a1a1a;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.highlight {
  background: #f0f9ff;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid #2563eb;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input.readonly {
  background: #f9fafb;
  font-weight: 700;
  color: #2563eb;
}

.kelly-info {
  background: linear-gradient(135deg, #f0f9ff 0%, white 100%);
  border: 2px solid #2563eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.kelly-info h3 {
  margin: 0 0 1rem;
  color: #1a1a1a;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item .label {
  font-size: 0.875rem;
  color: #666;
}

.info-item .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
}

.info-item .value.positive {
  color: #10b981;
}

.info-item .value.negative {
  color: #ef4444;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

.add-btn {
  flex: 1;
  padding: 0.75rem 2rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.add-btn:hover:not(:disabled) {
  background: #059669;
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  padding: 0.75rem 2rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.reset-btn:hover {
  background: #4b5563;
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
}

.message.success {
  background: #d1fae5;
  color: #065f46;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.kelly-bets-list {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.list-header h2 {
  margin: 0;
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.controls input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.controls button {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.controls button:hover:not(:disabled) {
  background: #1d4ed8;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
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

.bets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.kelly-bet-card {
  background: white;
  border: 2px solid #2563eb;
  border-radius: 8px;
  padding: 1rem;
}

.bet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.horse-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.bet-amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.bet-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.detail {
  display: flex;
  flex-direction: column;
}

.detail .label {
  font-size: 0.75rem;
  color: #666;
}

.detail .value {
  font-weight: 600;
  color: #1a1a1a;
}

.bet-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e5e5;
  font-size: 0.875rem;
}

.race-info {
  color: #666;
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

.total-card {
  background: linear-gradient(135deg, #f0f9ff 0%, white 100%);
  border: 2px solid #2563eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-around;
}

.total-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.total-item .label {
  font-size: 0.875rem;
  color: #666;
}

.total-item .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2563eb;
}
</style>
