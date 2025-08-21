import BasePuzzleFetcher from './BasePuzzleFetcher.js';

/**
 * Fetcher that uses the backend API to scrape puzzle data
 * This solves CORS issues by moving web scraping to the server-side
 */
class BackendApiFetcher extends BasePuzzleFetcher {
  constructor() {
    super('BackendAPI', {
      requestDelay: 1000,
      maxRetries: 3,
      timeout: 30000
    });
    
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  /**
   * Execute the fetch operation by calling the backend API
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Puzzle data
   */
  async _executeFetch(date) {
    const url = `${this.baseUrl}/api/fetch-puzzle/${date}`;
    console.log(`🌐 [BackendAPI] Making request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Backend API returned unsuccessful response');
      }
      
      console.log(`✅ [BackendAPI] Successfully fetched puzzle for ${date}`);
      
      return {
        date: data.data.date,
        gameId: data.data.gameId,
        groups: data.data.groups,
        words: data.data.words,
        source: `BackendAPI-${data.data.source}`,
        fetchedAt: data.data.fetchedAt
      };
      
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Backend API request timed out');
      }
      
      console.error(`❌ [BackendAPI] Error fetching puzzle for ${date}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if puzzle data is available for the given date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<boolean>} True if data is available
   */
  async isAvailable(date) {
    try {
      // Check if the backend API is responsive
      const healthUrl = `${this.baseUrl}/api/health`;
      const response = await fetch(healthUrl, { 
        signal: AbortSignal.timeout(5000) 
      });
      return response.ok;
    } catch (error) {
      console.warn(`⚠️ [BackendAPI] Availability check failed for ${date}: ${error.message}`);
      return false;
    }
  }
}

export default BackendApiFetcher;
