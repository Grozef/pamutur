/**
 * Shared fetch utility with timeout support
 */

const DEFAULT_TIMEOUT = 10000;

/**
 * Fetch with timeout and abort controller
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond');
    }
    throw error;
  }
}

/**
 * Fetch JSON with error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>}
 */
export async function fetchJson(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const response = await fetchWithTimeout(url, options, timeout);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || getDefaultErrorMessage(response.status);
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Get default error message based on HTTP status
 * @param {number} status - HTTP status code
 * @returns {string}
 */
function getDefaultErrorMessage(status) {
  switch (status) {
    case 400:
      return 'Bad request - invalid parameters';
    case 404:
      return 'Resource not found';
    case 500:
      return 'Server error - please try again later';
    default:
      return `HTTP error! status: ${status}`;
  }
}

export default {
  fetchWithTimeout,
  fetchJson
};
