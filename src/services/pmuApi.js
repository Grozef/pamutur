/**
 * PMU API Service
 *
 * FIXED: Improved error handling for resolveRaceId
 * - Better error messages
 * - Graceful degradation if endpoint not available
 */

import axios from 'axios'

// Configure axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/pmu',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error.response?.data || error)
  }
)

export const pmuApi = {
  /**
   * Get programme for a date
   */
  getProgramme(date) {
    return apiClient.get(`/${date}`)
  },

  /**
   * Get reunion details
   */
  getReunion(date, reunionNum) {
    return apiClient.get(`/${date}/R${reunionNum}`)
  },

  /**
   * Get participants for a race
   */
  getParticipants(reunionNum, courseNum, date) {
    return apiClient.get(`/${date}/R${reunionNum}/C${courseNum}/participants`)
  },

  /**
   * Resolve race ID from database
   *
   * FIXED: Better error handling
   * - Checks if endpoint exists (404 = not implemented yet)
   * - Provides clear error messages
   * - Allows parent to handle fallback gracefully
   */
  async resolveRaceId(data) {
    try {
      const response = await apiClient.post('/races/resolve-id', data)
      return response
    } catch (error) {
      // Check if endpoint doesn't exist yet (404)
      if (error.response?.status === 404) {
        throw new Error('resolveRaceId endpoint not implemented yet (add method to PMUController)')
      }

      // Check if route doesn't exist
      if (error.message?.includes('404')) {
        throw new Error('resolveRaceId endpoint not found (check routes/api.php)')
      }

      // Other errors
      throw new Error(error.message || 'Failed to resolve race ID')
    }
  },

  /**
   * Process daily predictions
   */
  processPredictions(date, predictions) {
    return apiClient.post('/betting/process-predictions', {
      date,
      predictions
    })
  },

  /**
   * Get daily bets
   */
  getDailyBets(date) {
    return apiClient.get('/betting/daily-bets', {
      params: { date }
    })
  },

  /**
   * Get value bets
   */
  getValueBets(date) {
    return apiClient.get('/betting/value-bets', {
      params: { date }
    })
  },

  /**
   * Get combinations
   */
  getCombinations(date) {
    return apiClient.get('/betting/combinations', {
      params: { date }
    })
  },

  /**
   * Fetch race results
   */
  fetchResults() {
    return apiClient.post('/betting/fetch-results')
  },

  /**
   * Get race results
   */
  getRaceResults(date) {
    return apiClient.get('/betting/race-results', {
      params: { date }
    })
  },

  /**
   * Generate daily report
   */
  generateReport(date) {
    return apiClient.get('/betting/generate-report', {
      params: { date }
    })
  },

  /**
   * Delete bets for a date
   */
  deleteBets(date) {
    return apiClient.delete('/betting/clear', {
      params: { date }
    })
  },

  /**
   * Add manual Kelly bet
   */
  addKellyBet(betData) {
    return apiClient.post('/betting/kelly-bets', betData)
  },

  /**
   * Get manual Kelly bets
   */
  getKellyBets(date) {
    return apiClient.get('/betting/kelly-bets', {
      params: { date }
    })
  },

  /**
   * Add manual bet
   */
  addManualBet(betData) {
    return apiClient.post('/betting/manual-bets', betData)
  },

  /**
   * Get manual bets
   */
  getManualBets(date) {
    return apiClient.get('/betting/manual-bets', {
      params: { date }
    })
  },

  /**
   * Delete manual bet
   */
  deleteManualBet(id) {
    return apiClient.delete(`/betting/manual-bets/${id}`)
  },

  /**
   * Add manual combination
   */
  addManualCombination(combinationData) {
    return apiClient.post('/betting/manual-combinations', combinationData)
  },

  /**
   * Get manual combinations
   */
  getManualCombinations(date, type = null) {
    return apiClient.get('/betting/manual-combinations', {
      params: { date, type }
    })
  },

  /**
   * Delete manual combination
   */
  deleteManualCombination(id) {
    return apiClient.delete(`/betting/manual-combinations/${id}`)
  },

  /**
   * Get manual bets summary
   */
  getManualBetsSummary(date) {
    return apiClient.get('/betting/manual-bets-summary', {
      params: { date }
    })
  },

  /**
   * Delete individual daily bet
   */
  deleteDailyBet(id) {
    return apiClient.delete(`/betting/daily-bets/${id}`)
  },

  /**
   * Delete individual value bet
   */
  deleteValueBet(id) {
    return apiClient.delete(`/betting/value-bets/${id}`)
  },

  /**
   * Delete individual combination
   */
  deleteCombination(id) {
    return apiClient.delete(`/betting/combinations/${id}`)
  }
}

export default pmuApi