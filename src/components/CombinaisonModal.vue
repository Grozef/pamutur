<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ type === 'COUPLE' ? '🔗 Couplé' : '🔗🔗 Trio' }}</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- Race Info (auto-filled) -->
        <div class="race-info">
          <div class="race-badge">
            {{ getRaceCode(firstBet.race) }}
          </div>
          <div class="race-details">
            <span v-if="firstBet.race?.hippodrome">📍 {{ firstBet.race.hippodrome }}</span>
            <span v-if="firstBet.race?.distance">📏 {{ firstBet.race.distance }}m</span>
          </div>
        </div>

        <!-- First Horse (selected) -->
        <div class="form-group">
          <label>Cheval 1 (sélectionné)</label>
          <div class="selected-horse">
            <span class="horse-name">{{ firstBet.horse_name }}</span>
            <span class="horse-proba">{{ getProbability(firstBet) }}%</span>
          </div>
        </div>

        <!-- Loading other horses -->
        <div v-if="loadingHorses" class="loading-horses">
          Chargement des autres chevaux...
        </div>

        <div v-else>
          <!-- Second Horse Selection -->
          <div class="form-group">
            <label>Cheval 2 *</label>
            <select v-model="selectedHorse2" required>
              <option value="">Sélectionnez un cheval</option>
              <option
                v-for="horse in availableHorses"
                :key="horse.id"
                :value="horse"
              >
                {{ horse.horse_name }} ({{ (horse.probability * 100).toFixed(1) }}%)
              </option>
            </select>
          </div>

          <!-- Third Horse Selection (if TRIO) -->
          <div v-if="type === 'TRIO'" class="form-group">
            <label>Cheval 3 *</label>
            <select v-model="selectedHorse3" required>
              <option value="">Sélectionnez un cheval</option>
              <option
                v-for="horse in availableHorsesForThird"
                :key="horse.id"
                :value="horse"
              >
                {{ horse.horse_name }} ({{ (horse.probability * 100).toFixed(1) }}%)
              </option>
            </select>
          </div>
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label>Montant (€) *</label>
          <input
            type="number"
            v-model.number="amount"
            min="1"
            max="1000"
            step="0.5"
            required
          />
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Summary -->
        <div v-if="canShowSummary" class="summary">
          <h4>Résumé</h4>
          <div class="summary-horses">
            <div class="summary-horse">① {{ firstBet.horse_name }}</div>
            <div class="summary-horse" v-if="selectedHorse2">
              ② {{ selectedHorse2.horse_name }}
            </div>
            <div class="summary-horse" v-if="type === 'TRIO' && selectedHorse3">
              ③ {{ selectedHorse3.horse_name }}
            </div>
          </div>
          <div class="summary-amount">
            Mise totale : <strong>{{ amount.toFixed(2) }}€</strong>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="cancel-btn">Annuler</button>
        <button
          @click="submitCombinaison"
          :disabled="submitting || !canSubmit"
          class="submit-btn"
        >
          {{ submitting ? 'Ajout...' : 'Ajouter' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  firstBet: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['COUPLE', 'TRIO'].includes(value)
  },
  isValueBet: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const loadingHorses = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const amount = ref(10)

const allHorsesInRace = ref([])
const selectedHorse2 = ref('')
const selectedHorse3 = ref('')

// Available horses (excluding first horse and already selected)
const availableHorses = computed(() => {
  return allHorsesInRace.value.filter(horse =>
    horse.horse_id !== props.firstBet.horse_id
  )
})

// Available horses for third selection (excluding first and second)
const availableHorsesForThird = computed(() => {
  if (!selectedHorse2.value) return []

  return allHorsesInRace.value.filter(horse =>
    horse.horse_id !== props.firstBet.horse_id &&
    horse.horse_id !== selectedHorse2.value.horse_id
  )
})

const canShowSummary = computed(() => {
  if (props.type === 'COUPLE') {
    return selectedHorse2.value !== ''
  }
  return selectedHorse2.value !== '' && selectedHorse3.value !== ''
})

const canSubmit = computed(() => {
  if (props.type === 'COUPLE') {
    return selectedHorse2.value !== '' && amount.value >= 1
  }
  return selectedHorse2.value !== '' && selectedHorse3.value !== '' && amount.value >= 1
})

const getRaceCode = (race) => {
  if (!race) return 'N/A'
  return race.race_code || `#${race.id || 'N/A'}`
}

const getProbability = (bet) => {
  const prob = props.isValueBet ? bet.estimated_probability : bet.probability
  return (prob * 100).toFixed(1)
}

/**
 * Load all horses from the same race
 */
const loadHorsesFromRace = async () => {
  loadingHorses.value = true
  errorMessage.value = ''

  try {
    const raceId = props.firstBet.race_id

    // Load both DailyBets and ValueBets for this race
    const [dailyResponse, valueResponse] = await Promise.all([
      fetch(`/api/pmu/betting/daily-bets?date=${props.date}`),
      fetch(`/api/pmu/betting/value-bets?date=${props.date}`)
    ])

    const dailyData = await dailyResponse.json()
    const valueData = await valueResponse.json()

    // Filter for same race and combine
    const dailyHorses = (dailyData.data || [])
      .filter(b => b.race_id === raceId)
      .map(b => ({
        id: b.id,
        horse_id: b.horse_id,
        horse_name: b.horse_name,
        probability: b.probability,
        source: 'daily'
      }))

    const valueHorses = (valueData.data || [])
      .filter(b => b.race_id === raceId)
      .map(b => ({
        id: b.id,
        horse_id: b.horse_id,
        horse_name: b.horse_name,
        probability: b.estimated_probability,
        source: 'value'
      }))

    // Merge and deduplicate by horse_id
    const allHorses = [...dailyHorses, ...valueHorses]
    const uniqueHorses = Array.from(
      new Map(allHorses.map(h => [h.horse_id, h])).values()
    )

    // Sort by probability desc
    allHorsesInRace.value = uniqueHorses.sort((a, b) => b.probability - a.probability)

    if (allHorsesInRace.value.length < 2) {
      errorMessage.value = 'Pas assez de chevaux dans cette course pour créer une combinaison'
    }

  } catch (error) {
    console.error('Error loading horses:', error)
    errorMessage.value = 'Erreur lors du chargement des chevaux'
  } finally {
    loadingHorses.value = false
  }
}

/**
 * Submit the combination
 */
const submitCombinaison = async () => {
  errorMessage.value = ''
  submitting.value = true

  try {
    const horses = [
      {
        horse_id: props.firstBet.horse_id,
        horse_name: props.firstBet.horse_name
      },
      {
        horse_id: selectedHorse2.value.horse_id,
        horse_name: selectedHorse2.value.horse_name
      }
    ]

    if (props.type === 'TRIO') {
      horses.push({
        horse_id: selectedHorse3.value.horse_id,
        horse_name: selectedHorse3.value.horse_name
      })
    }

    // Extract reunion and course from race_code (R1C3 -> reunion: 1, course: 3)
    const raceCode = props.firstBet.race?.race_code || ''
    const match = raceCode.match(/R(\d+)C(\d+)/)

    let reunionNumber = null
    let courseNumber = null

    if (match) {
      reunionNumber = parseInt(match[1])
      courseNumber = parseInt(match[2])
    }

    const payload = {
      bet_date: props.date,
      race_id: props.firstBet.race_id,
      reunion_number: reunionNumber,
      course_number: courseNumber,
      combination_type: props.type,
      horses: horses,
      amount: amount.value
    }

    const response = await fetch('/api/pmu/betting/manual-combinations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Erreur lors de l\'ajout')
    }

    emit('success')
    emit('close')

  } catch (error) {
    console.error('Error submitting combination:', error)
    errorMessage.value = error.message || 'Erreur lors de l\'ajout'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadHorsesFromRace()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1a1a1a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.race-info {
  background: #f0f9ff;
  border-left: 4px solid #2563eb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.race-badge {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 0.5rem;
}

.race-details {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #666;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.selected-horse {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.horse-name {
  font-weight: 600;
  color: #1a1a1a;
}

.horse-proba {
  background: #2563eb;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

select,
input[type="number"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

select:focus,
input:focus {
  outline: none;
  border-color: #2563eb;
}

.loading-horses {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  margin-top: 1rem;
}

.summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.summary h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #1a1a1a;
}

.summary-horses {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.summary-horse {
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  font-weight: 600;
}

.summary-amount {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.summary-amount strong {
  color: #10b981;
  font-size: 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e5e5;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #666;
}

.cancel-btn:hover {
  background: #f3f4f6;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.submit-btn:hover:not(:disabled) {
  background: #059669;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>