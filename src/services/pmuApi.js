const BASE_URL = '/api/pmu';

export const pmuApi = {
  // Get today's date in DDMMYYYY format
  getTodayDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}${month}${year}`;
  },

  // Get date in DDMMYYYY format from Date object
  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}${month}${year}`;
  },

  // Fetch daily program
  async getProgramme(date = null) {
    const dateStr = date || this.getTodayDate();
    const url = `${BASE_URL}/${dateStr}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching programme:', error);
      throw error;
    }
  },

  // Fetch specific reunion
  async getReunion(reunionNum, date = null) {
    const dateStr = date || this.getTodayDate();
    const url = `${BASE_URL}/${dateStr}/R${reunionNum}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching reunion:', error);
      throw error;
    }
  },

  // Fetch specific course
  async getCourse(reunionNum, courseNum, date = null) {
    const dateStr = date || this.getTodayDate();
    const url = `${BASE_URL}/${dateStr}/R${reunionNum}/C${courseNum}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  // Fetch participants (horses with their "musique")
  async getParticipants(reunionNum, courseNum, date = null) {
    const dateStr = date || this.getTodayDate();
    const url = `${BASE_URL}/${dateStr}/R${reunionNum}/C${courseNum}/participants`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching participants:', error);
      throw error;
    }
  }
};
