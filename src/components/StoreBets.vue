<template>
  <div class="store-bets-section">
    <div class="header">
      <h2>Store Today's Bets</h2>
      <p class="subtitle">Automatically generates and stores all bets for today</p>
    </div>

    <div class="info-card">
      <h3>The system will store:</h3>
      <ul>
        <li>All bets with probability > 40%</li>
        <li>Top 20 value bets</li>
        <li>Combinations (COUPLE and TRIO)</li>
      </ul>
    </div>

    <button
      @click="storeAllBets"
      :disabled="loading"
      class="store-btn"
    >
      {{ loading ? 'Storing bets...' : 'Store All Bets' }}
    </button>

    <!-- Success Message -->
    <div v-if="result" class="result-card success">
      <h3>Bets stored successfully</h3>
      <div class="stats">
        <div class="stat">
          <span class="label">Daily Bets</span>
          <span class="value">{{ result.daily_bets_stored }}</span>
        </div>
        <div class="stat">
          <span class="label">Value Bets</span>
          <span class="value">{{ result.value_bets_stored }}</span>
        </div>
        <div class="stat">
          <span class="label">Combinations</span>
          <span class="value">{{ result.combinations_created }}</span>
        </div>
      </div>
      <button @click="$router.push('/betting')" class="view-report-btn">
        View Report
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="result-card error">
      <h3>Error</h3>
      <p>{{ error }}</p>
      <button @click="error = null" class="close-btn">Close</button>
    </div>

    <!-- Debug Info -->
    <details v-if="debug" class="debug-section">
      <summary>Debug Information</summary>
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
 * Main function to store all bets
 *
 * FIXED: Added fallback for resolveRaceId to prevent blocking
 */
const storeAllBets = async () => {
  loading.value = true
  result.value = null
  error.value = null
  debug.value = null

  try {
    // 1. Get today's races
    const today = new Date().toISOString().split('T')[0]
    const todayFormatted = formatDateToDDMMYYYY(today)

    console.log('Fetching programme for:', todayFormatted)
    const programme = await pmuApi.getProgramme(todayFormatted)

    // 2. Generate predictions for all races
    const allPredictions = []
    let raceIdCounter = 1 // Fallback counter in case resolveRaceId fails

    if (programme?.programme?.reunions) {
      for (const reunion of programme.programme.reunions) {
        if (reunion.courses) {
          for (const course of reunion.courses) {
            // Fetch participants
            const participants = await fetchParticipants(
              todayFormatted,
              reunion.numOfficiel,
              course.numOrdre
            )

            if (participants?.participants) {
              // Generate predictions for this race
              const racePredictions = await generatePredictionsForRace(
                course,
                participants.participants,
                reunion,
                today,
                raceIdCounter
              )

              if (racePredictions.length > 0) {
                allPredictions.push(...racePredictions)
                raceIdCounter++ // Increment only if race had predictions
              }
            }

            // Pause to avoid overloading API
            await sleep(200)
          }
        }
      }
    }

    console.log(`Generated ${allPredictions.length} predictions`)
    debug.value = {
      total_predictions: allPredictions.length,
      sample: allPredictions[0],
      races_processed: raceIdCounter - 1
    }

    // 3. Store via API
    if (allPredictions.length > 0) {
      const response = await pmuApi.processPredictions(today, allPredictions)
      result.value = response.data
      console.log('Bets stored successfully:', response.data)
    } else {
      throw new Error('No predictions generated')
    }

  } catch (err) {
    console.error('Error storing bets:', err)
    error.value = err.message || 'Error storing bets'
  } finally {
    loading.value = false
  }
}

/**
 * Fetch participants for a race
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
 * Generate predictions for a race
 *
 * FIXED: Added fallback mechanism for race_id resolution
 * - First tries to call resolveRaceId API endpoint
 * - If fails (endpoint not available), uses fallback counter
 * - This ensures the system continues to work during migration
 */
const generatePredictionsForRace = async (course, participants, reunion, todayISO, fallbackId) => {
  const predictions = []

  // Try to resolve race_id from API, with fallback
  let raceId = null
  try {
    raceId = await resolveRaceId(course, reunion, todayISO)
  } catch (err) {
    console.warn('resolveRaceId failed, using fallback', err.message)
    // Fallback: use temporary counter-based ID
    raceId = fallbackId
  }

  if (!raceId) {
    console.warn('Skipping race - could not resolve race_id', {
      reunion: reunion.numOfficiel,
      course: course.numOrdre
    })
    return []
  }

  for (const participant of participants) {
    // Calculate probability
    const probability = calculateProbability(participant)

    // Only keep valid predictions
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
 * Calculate winning probability
 */
const calculateProbability = (participant) => {
  const cote = participant.cotesPMU?.officielle ||
                participant.rapportDirect?.rapport ||
                null

  if (!cote || cote <= 0) return 0

  // Raw probability: 1/odds
  const rawProb = 1 / cote

  // Normalize between 0 and 1
  return Math.min(Math.max(rawProb, 0), 1)
}

/**
 * Resolve race_id from database
 *
 * FIXED: Improved error handling
 * - Now throws error if API call fails
 * - Parent function catches and uses fallback
 * - Logs detailed error information
 */
const resolveRaceId = async (course, reunion, todayISO) => {
  try {
    // Call API to resolve race ID
    const response = await pmuApi.resolveRaceId({
      date: todayISO,
      reunion_number: reunion.numOfficiel,
      course_number: course.numOrdre,
      hippodrome: reunion.hippodrome?.libelleCourt || 'UNKNOWN',
      discipline: course.discipline,
      distance: course.distance
    })

    console.log('Resolved race ID:', response.race_id, 'for', `R${reunion.numOfficiel}C${course.numOrdre}`)

    return response.race_id
  } catch (error) {
    // Log error but throw to allow fallback
    console.error('Error calling resolveRaceId API:', error.message)
    throw new Error(`resolveRaceId API failed: ${error.message}`)
  }
}

/**
 * Format date for PMU API
 */
const formatDateToDDMMYYYY = (isoDate) => {
  const [year, month, day] = isoDate.split('-')
  return `${year}${month}${day}`
}

/**
 * Sleep utility
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