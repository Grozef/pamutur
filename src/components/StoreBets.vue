<template>
  <div class="store-bets-section">
    <div class="header">
      <h2>💾 Stocker les Paris du Jour</h2>
      <p class="subtitle">Génère et stocke automatiquement tous les paris pour aujourd'hui</p>
    </div>

    <div class="info-card">
      <h3>Le système va stocker:</h3>
      <ul>
        <li>✓ Tous les paris avec probabilité > 40%</li>
        <li>✓ Les 20 meilleurs value bets</li>
        <li>✓ Les combinaisons (COUPLE et TRIO)</li>
      </ul>
    </div>

    <button
      @click="storeAllBets"
      :disabled="loading"
      class="store-btn"
    >
      {{ loading ? '⏳ Stockage en cours...' : '💾 Stocker Tous les Paris' }}
    </button>

    <!-- Success Message -->
    <div v-if="result" class="result-card success">
      <h3>✓ Paris stockés avec succès !</h3>
      <div class="stats">
        <div class="stat">
          <span class="label">Paris Quotidiens</span>
          <span class="value">{{ result.daily_bets_stored }}</span>
        </div>
        <div class="stat">
          <span class="label">Value Bets</span>
          <span class="value">{{ result.value_bets_stored }}</span>
        </div>
        <div class="stat">
          <span class="label">Combinaisons</span>
          <span class="value">{{ result.combinations_created }}</span>
        </div>
      </div>
      <button @click="$router.push('/betting')" class="view-report-btn">
        📊 Voir le Rapport
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="result-card error">
      <h3>✗ Erreur</h3>
      <p>{{ error }}</p>
      <button @click="error = null" class="close-btn">Fermer</button>
    </div>

    <!-- Debug Info -->
    <details v-if="debug" class="debug-section">
      <summary>🔍 Informations de Debug</summary>
      <pre>{{ JSON.stringify(debug, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { pmuApi } from '@/services/pmuApi'

const loading = ref(false)
const result = ref(null)
const error = ref(null)
const debug = ref(null)

/**
 * Fonction principale pour stocker tous les paris
 */
const storeAllBets = async () => {
  loading.value = true
  result.value = null
  error.value = null
  debug.value = null

  try {
    // 1. Récupérer les courses du jour
    const today = new Date().toISOString().split('T')[0]
    const todayFormatted = formatDateToDDMMYYYY(today)

    console.log('Fetching programme for:', todayFormatted)
    const programme = await pmuApi.getProgramme(todayFormatted)

    // 2. Générer les prédictions pour toutes les courses
    const allPredictions = []

    if (programme?.programme?.reunions) {
      for (const reunion of programme.programme.reunions) {
        if (reunion.courses) {
          for (const course of reunion.courses) {
            // Récupérer les participants
            const participants = await fetchParticipants(
              todayFormatted,
              reunion.numOfficiel,
              course.numOrdre
            )

            if (participants?.participants) {
              // Générer prédictions pour cette course
              const racePredictions = generatePredictionsForRace(
                course,
                participants.participants,
                reunion
              )
              allPredictions.push(...racePredictions)
            }

            // Pause pour ne pas surcharger l'API
            await sleep(200)
          }
        }
      }
    }

    console.log(`Generated ${allPredictions.length} predictions`)
    debug.value = { total_predictions: allPredictions.length, sample: allPredictions[0] }

    // 3. Stocker via API
    if (allPredictions.length > 0) {
      const response = await pmuApi.processPredictions(today, allPredictions)
      result.value = response.data
      console.log('Bets stored successfully:', response.data)
    } else {
      throw new Error('Aucune prédiction générée')
    }

  } catch (err) {
    console.error('Error storing bets:', err)
    error.value = err.message || 'Erreur lors du stockage des paris'
  } finally {
    loading.value = false
  }
}

/**
 * Récupérer les participants d'une course
 */
const fetchParticipants = async (date, reunionNum, courseNum) => {
  try {
    return await pmuApi.getParticipants(reunionNum, courseNum, date)
  } catch (err) {
    console.error(`Error fetching participants R${reunionNum}C${courseNum}:`, err)
    return null
  }
}

/**
 * Générer les prédictions pour une course
 */
const generatePredictionsForRace = (course, participants, reunion) => {
  const predictions = []

  // Résoudre le race_id (à adapter selon votre logique)
  const raceId = resolveRaceId(course, reunion)

  for (const participant of participants) {
    // Calculer la probabilité (méthode simple basée sur les cotes)
    const probability = calculateProbability(participant)

    // Ne garder que les prédictions valides
    if (probability > 0 && probability <= 1) {
      predictions.push({
        race_id: raceId,
        horse_id: participant.cheval?.id,
        horse_name: participant.cheval?.nom,
        probability: probability,
        odds: participant.cotesPMU?.officielle || participant.rapportDirect?.rapport || null,
        metadata: {
          jockey: participant.driver?.nom,
          trainer: participant.entraineur?.nom,
          hippodrome: reunion.hippodrome?.libelleCourt,
          discipline: course.discipline
        }
      })
    }
  }

  return predictions
}

/**
 * Calculer la probabilité de victoire
 * Méthode simple: 1 / cote (normalisée)
 */
const calculateProbability = (participant) => {
  const cote = participant.cotesPMU?.officielle ||
                participant.rapportDirect?.rapport ||
                null

  if (!cote || cote <= 0) return 0

  // Probabilité brute: 1/cote
  const rawProb = 1 / cote

  // Normaliser entre 0 et 1
  return Math.min(Math.max(rawProb, 0), 1)
}

/**
 * Résoudre le race_id depuis votre base de données
 * IMPORTANT: À adapter selon votre structure
 */
const resolveRaceId = (course, reunion) => {
  // Option 1: Si vous avez déjà les IDs dans votre DB
  // Faire un appel à votre endpoint: GET /api/pmu/races/resolve

  // Option 2: Pour le test, utiliser un ID temporaire
  // À REMPLACER par votre logique réelle
  return course.id || `${reunion.numOfficiel}_${course.numOrdre}`
}

/**
 * Formatter la date pour l'API PMU
 */
const formatDateToDDMMYYYY = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${year}${month}${day}`
}

/**
 * Pause utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
</script>

<style scoped>
.store-bets-section {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  margin: 0;
  font-size: 2rem;
  color: #1a1a1a;
}

.subtitle {
  color: #666;
  margin-top: 0.5rem;
}

.info-card {
  background: #f0f9ff;
  border-left: 4px solid #2563eb;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.info-card h3 {
  margin: 0 0 1rem;
  color: #1a1a1a;
}

.info-card ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-card li {
  margin: 0.5rem 0;
  color: #1a1a1a;
}

.store-btn {
  width: 100%;
  padding: 1rem 2rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.store-btn:hover:not(:disabled) {
  background: #059669;
}

.store-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-card {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.result-card.success {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.result-card.error {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.result-card h3 {
  margin: 0 0 1rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.stat .label {
  display: block;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat .value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
}

.view-report-btn {
  width: 100%;
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
}

.view-report-btn:hover {
  background: #1d4ed8;
}

.close-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}

.close-btn:hover {
  background: #dc2626;
}

.debug-section {
  margin-top: 2rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
}

.debug-section pre {
  margin: 1rem 0 0;
  padding: 1rem;
  background: #1f2937;
  color: #f9fafb;
  border-radius: 4px;
  overflow-x: auto;
}
</style>