/**
 * Shared date utility functions
 * Handles conversions between different date formats used in the app
 */

/**
 * Get today's date in DDMMYYYY format (PMU API format)
 * @returns {string}
 */
export function getTodayDDMMYYYY() {
  return formatDateToDDMMYYYY(new Date());
}

/**
 * Get today's date in YYYY-MM-DD format (ISO format)
 * @returns {string}
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format Date object to DDMMYYYY (PMU API format)
 * @param {Date} date
 * @returns {string}
 */
export function formatDateToDDMMYYYY(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}${month}${year}`;
}

/**
 * Format Date object to YYYY-MM-DD (ISO format)
 * @param {Date} date
 * @returns {string}
 */
export function formatDateToISO(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Convert DDMMYYYY to YYYY-MM-DD
 * @param {string} ddmmyyyy
 * @returns {string}
 */
export function convertDDMMYYYYToISO(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length !== 8) return ddmmyyyy;
  const day = ddmmyyyy.slice(0, 2);
  const month = ddmmyyyy.slice(2, 4);
  const year = ddmmyyyy.slice(4, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Convert YYYY-MM-DD to DDMMYYYY
 * @param {string} isoDate
 * @returns {string}
 */
export function convertISOToDDMMYYYY(isoDate) {
  if (!isoDate || isoDate.length !== 10) return isoDate;
  const [year, month, day] = isoDate.split('-');
  return `${day}${month}${year}`;
}

/**
 * Parse DDMMYYYY string to Date object
 * @param {string} ddmmyyyy
 * @returns {Date}
 */
export function parseDDMMYYYY(ddmmyyyy) {
  if (!ddmmyyyy || ddmmyyyy.length !== 8) return new Date();
  const day = parseInt(ddmmyyyy.slice(0, 2), 10);
  const month = parseInt(ddmmyyyy.slice(2, 4), 10) - 1;
  const year = parseInt(ddmmyyyy.slice(4, 8), 10);
  return new Date(year, month, day);
}

/**
 * Format time from ISO datetime string
 * @param {string} isoDatetime
 * @returns {string}
 */
export function formatTimeFromISO(isoDatetime) {
  return new Date(isoDatetime).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default {
  getTodayDDMMYYYY,
  getTodayISO,
  formatDateToDDMMYYYY,
  formatDateToISO,
  convertDDMMYYYYToISO,
  convertISOToDDMMYYYY,
  parseDDMMYYYY,
  formatTimeFromISO
};
