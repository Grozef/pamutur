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
    </div>

    <div class="tabs">
      <button
        :class="{ active: currentTab === 'all' }"
        @click="currentTab = 'all'"
      >
        Tous les chevaux ({{ sortedHorses.length }})
      </button>
      <button
        :class="{ active: currentTab === 'value' }"
        @click="currentTab = 'value'"
      >
        Value Bets uniquement ({{ valueBets.length }})
      </button>
    </div>

    <div v-if="loading" class="loading">
      Chargement des prédictions...
    </div>

    <div v-else class="horses-grid">
      <div
        v-for="(horse, index) in currentTab === 'all' ? sortedHorses : valueBets"
        :key="`${horse.horse_id}-${horse.race_code}`"
        class="horse-card"
        :class="{ 'value-bet': horse.value_bet }"
      >
        <div class="rank">{{ index + 1 }}</div>

        <div class="horse-main">
          <div class="horse-header">
            <h3>{{ horse.horse_name }}</h3>
            <div class="probability">
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
        </div>

        <div v-if="horse.value_bet" class="value-indicator">
          VALUE BET
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

  // Charger toutes les courses et leurs prédictions
  async function loadAllPredictions() {
    loading.value = true
    allPredictions.value = []

    try {
      // 1. Récupérer toutes les courses du jour
      const racesResponse = await fetch(
        `http://localhost:8000/api/pmu/races?date=${selectedDate.value}`
      )

      if (!racesResponse.ok) {
        throw new Error(`HTTP error! status: ${racesResponse.status}`)
      }

      const racesData = await racesResponse.json()

      // S'assurer que c'est bien un tableau
      races.value = Array.isArray(racesData) ? racesData : []

      console.log('Courses récupérées:', races.value.length)

      // 2. Pour chaque course, récupérer les prédictions
      for (const race of races.value) {
        try {
          const predResponse = await fetch(
            `http://localhost:8000/api/pmu/races/${race.id}/predictions`
          )

          if (!predResponse.ok) {
            console.warn(`Course ${race.id} - predictions non disponibles`)
            continue
          }

          const predData = await predResponse.json()

          // Enrichir chaque prédiction avec les infos de la course
          if (predData.predictions && Array.isArray(predData.predictions)) {
            predData.predictions.forEach(pred => {
              allPredictions.value.push({
                ...pred,
                race_code: race.code,
                hippodrome: race.hippodrome,
                distance: race.distance,
                discipline: race.discipline,
                race_time: new Date(race.date).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
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

  // Trier par probabilité décroissante
  const sortedHorses = computed(() => {
    return [...allPredictions.value].sort((a, b) => b.probability - a.probability)
  })

  // Filtrer seulement les value bets
  const valueBets = computed(() => {
    return sortedHorses.value.filter(h => h.value_bet)
  })

  onMounted(() => {
    loadAllPredictions()
  })
  </script>

  <!-- Le reste du template reste identique -->
  ```

  **Ensuite, teste directement l'API dans ton navigateur :**
  ```
  http://localhost:8000/api/pmu/races?date=2026-01-19