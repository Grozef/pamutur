<template>
  <div class="manual-combinations">
    <div class="header">
      <h2>🔗 Combinaisons Manuelles</h2>
      <p class="subtitle">Ajoutez vos couplés et trios manuellement</p>
    </div>

    <!-- Date Selector -->
    <div class="date-selector">
      <label>Date :</label>
      <input type="date" v-model="selectedDate" @change="loadCombinations" />
      <button @click="showAddModal = true" class="add-btn">
        ➕ Ajouter une Combinaison
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-bar" v-if="combinations.length > 0">
      <div class="stat">
        <span class="label">Total Combinaisons</span>
        <span class="value">{{ combinations.length }}</span>
      </div>
      <div class="stat">
        <span class="label">Couplés</span>
        <span class="value">{{ coupleCount }}</span>
      </div>
      <div class="stat">
        <span class="label">Trios</span>
        <span class="value">{{ trioCount }}</span>
      </div>
      <div class="stat">
        <span class="label">Montant Total</span>
        <span class="value">{{ totalAmount.toFixed(2) }}€</span>
      </div>
    </div>

    <!-- Combinations List -->
    <div v-if="loading" class="loading">Chargement...</div>

    <div v-else-if="combinations.length === 0" class="empty-state">
      <p>Aucune combinaison pour cette date</p>
      <button @click="showAddModal = true" class="add-btn">
        ➕ Ajouter une Combinaison
      </button>
    </div>

    <div v-else class="combinations-list">
      <div
        v-for="combo in combinations"
        :key="combo.id"
        class="combo-card"
        :class="{ 'combo-couple': combo.combination_type === 'COUPLE', 'combo-trio': combo.combination_type === 'TRIO' }"
      >
        <div class="combo-header">
          <div class="combo-type-badge">
            {{ combo.combination_type === 'COUPLE' ? '🔗 Couplé' : '🔗🔗 Trio' }}
          </div>
          <div class="combo-race">
            R{{ combo.reunion_number }}C{{ combo.course_number }}
          </div>
        </div>

        <div class="horses-list">
          <div
            v-for="(horse, index) in combo.horses"
            :key="index"
            class="horse-chip"
          >
            <span class="horse-number">{{ index + 1 }}</span>
            <span class="horse-name">{{ horse.horse_name }}</span>
          </div>
        </div>

        <div class="combo-footer">
          <div class="combo-amount">
            <span class="amount-label">Mise :</span>
            <span class="amount-value">{{ parseFloat(combo.amount).toFixed(2) }}€</span>
          </div>
          <button @click="deleteCombination(combo.id)" class="delete-btn">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Add Combination Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Ajouter une Combinaison</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <!-- Type Selection -->
          <div class="form-group">
            <label>Type de Combinaison *</label>
            <div class="type-buttons">
              <button
                :class="{ active: form.combination_type === 'COUPLE' }"
                @click="form.combination_type = 'COUPLE'"
                class="type-btn"
              >
                🔗 Couplé (2 chevaux)
              </button>
              <button
                :class="{ active: form.combination_type === 'TRIO' }"
                @click="form.combination_type = 'TRIO'"
                class="type-btn"
              >
                🔗🔗 Trio (3 chevaux)
              </button>
            </div>
          </div>

          <!-- Race Info -->
          <div class="form-row">
            <div class="form-group">
              <label>Réunion *</label>
              <input
                type="number"
                v-model.number="form.reunion_number"
                min="1"
                max="20"
                placeholder="Ex: 1"
                required
              />
            </div>
            <div class="form-group">
              <label>Course *</label>
              <input
                type="number"
                v-model.number="form.course_number"
                min="1"
                max="20"
                placeholder="Ex: 5"
                required
              />
            </div>
          </div>

          <!-- Horses -->
          <div class="form-group">
            <label>Cheval 1 *</label>
            <input
              v-model="form.horses[0].horse_name"
              type="text"
              placeholder="Nom du premier cheval"
              required
            />
            <input
              v-model="form.horses[0].horse_id"
              type="text"
              placeholder="ID du cheval (optionnel)"
              class="horse-id-input"
            />
          </div>

          <div class="form-group">
            <label>Cheval 2 *</label>
            <input
              v-model="form.horses[1].horse_name"
              type="text"
              placeholder="Nom du deuxième cheval"
              required
            />
            <input
              v-model="form.horses[1].horse_id"
              type="text"
              placeholder="ID du cheval (optionnel)"
              class="horse-id-input"
            />
          </div>

          <div v-if="form.combination_type === 'TRIO'" class="form-group">
            <label>Cheval 3 *</label>
            <input
              v-model="form.horses[2].horse_name"
              type="text"
              placeholder="Nom du troisième cheval"
              required
            />
            <input
              v-model="form.horses[2].horse_id"
              type="text"
              placeholder="ID du cheval (optionnel)"
              class="horse-id-input"
            />
          </div>

          <!-- Amount -->
          <div class="form-group">
            <label>Montant (€) *</label>
            <input
              type="number"
              v-model.number="form.amount"
              min="1"
              max="1000"
              step="0.5"
              placeholder="10.00"
              required
            />
          </div>

          <!-- Error Message -->
          <div v-if="formError" class="error-message">
            {{ formError }}
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="cancel-btn">Annuler</button>
          <button @click="submitCombination" :disabled="submitting" class="submit-btn">
            {{ submitting ? 'Ajout...' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const selectedDate = ref(new Date().toISOString().split('T')[0])
const combinations = ref([])
const loading = ref(false)
const showAddModal = ref(false)
const submitting = ref(false)
const formError = ref('')

// Form state
const form = ref({
  combination_type: 'COUPLE',
  reunion_number: null,
  course_number: null,
  horses: [
    { horse_id: '', horse_name: '' },
    { horse_id: '', horse_name: '' },
    { horse_id: '', horse_name: '' }
  ],
  amount: 10
})

// Computed
const coupleCount = computed(() =>
  combinations.value.filter(c => c.combination_type === 'COUPLE').length
)

const trioCount = computed(() =>
  combinations.value.filter(c => c.combination_type === 'TRIO').length
)

const totalAmount = computed(() =>
  combinations.value.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
)

// Methods
const loadCombinations = async () => {
  loading.value = true
  try {
    const response = await fetch(
      `/api/pmu/betting/manual-combinations?date=${selectedDate.value}`
    )
    const data = await response.json()
    combinations.value = data.success ? data.data : []
  } catch (error) {
    console.error('Error loading combinations:', error)
    combinations.value = []
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  showAddModal.value = false
  resetForm()
  formError.value = ''
}

const resetForm = () => {
  form.value = {
    combination_type: 'COUPLE',
    reunion_number: null,
    course_number: null,
    horses: [
      { horse_id: '', horse_name: '' },
      { horse_id: '', horse_name: '' },
      { horse_id: '', horse_name: '' }
    ],
    amount: 10
  }
}

const validateForm = () => {
  if (!form.value.reunion_number || !form.value.course_number) {
    formError.value = 'Veuillez renseigner la réunion et la course'
    return false
  }

  const horsesCount = form.value.combination_type === 'COUPLE' ? 2 : 3
  for (let i = 0; i < horsesCount; i++) {
    if (!form.value.horses[i].horse_name.trim()) {
      formError.value = `Veuillez renseigner le nom du cheval ${i + 1}`
      return false
    }
  }

  if (!form.value.amount || form.value.amount < 1) {
    formError.value = 'Le montant doit être au moins 1€'
    return false
  }

  return true
}

const submitCombination = async () => {
  formError.value = ''

  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    // Prepare horses array based on type
    const horsesCount = form.value.combination_type === 'COUPLE' ? 2 : 3
    const horses = form.value.horses.slice(0, horsesCount).map(h => ({
      horse_id: h.horse_id || h.horse_name,
      horse_name: h.horse_name
    }))

    const payload = {
      bet_date: selectedDate.value,
      reunion_number: form.value.reunion_number,
      course_number: form.value.course_number,
      combination_type: form.value.combination_type,
      horses: horses,
      amount: form.value.amount
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

    // Success
    await loadCombinations()
    closeModal()
  } catch (error) {
    console.error('Error submitting combination:', error)
    formError.value = error.message || 'Erreur lors de l\'ajout'
  } finally {
    submitting.value = false
  }
}

const deleteCombination = async (id) => {
  if (!confirm('Voulez-vous vraiment supprimer cette combinaison ?')) {
    return
  }

  try {
    const response = await fetch(`/api/pmu/betting/manual-combinations/${id}`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Erreur lors de la suppression')
    }

    await loadCombinations()
  } catch (error) {
    console.error('Error deleting combination:', error)
    alert('Erreur lors de la suppression')
  }
}

// Watch for type change to reset third horse
watch(() => form.value.combination_type, (newType) => {
  if (newType === 'COUPLE') {
    form.value.horses[2] = { horse_id: '', horse_name: '' }
  }
})

onMounted(() => {
  loadCombinations()
})
</script>

<style scoped>
.manual-combinations {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  margin: 0;
  font-size: 2rem;
  color: #1a1a1a;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #666;
}

.date-selector {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.date-selector label {
  font-weight: 600;
}

.date-selector input[type="date"] {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.add-btn {
  padding: 0.5rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-left: auto;
}

.add-btn:hover {
  background: #059669;
}

.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat .label {
  font-size: 0.875rem;
  color: #666;
}

.stat .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.combinations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.combo-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #2563eb;
}

.combo-card.combo-couple {
  border-left-color: #2563eb;
}

.combo-card.combo-trio {
  border-left-color: #10b981;
}

.combo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.combo-type-badge {
  font-weight: 600;
  color: #1a1a1a;
}

.combo-race {
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
}

.horses-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.horse-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
}

.horse-number {
  width: 24px;
  height: 24px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}

.horse-name {
  font-weight: 600;
  color: #1a1a1a;
}

.combo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
}

.combo-amount {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.amount-label {
  font-size: 0.875rem;
  color: #666;
}

.amount-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.delete-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.delete-btn:hover {
  background: #dc2626;
}

/* Modal Styles */
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.horse-id-input {
  margin-top: 0.5rem;
  font-size: 0.875rem !important;
  opacity: 0.7;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.type-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.type-btn {
  padding: 1rem;
  border: 2px solid #e5e5e5;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: #2563eb;
}

.type-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.error-message {
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  margin-top: 1rem;
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