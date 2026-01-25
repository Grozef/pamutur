// Simple Node.js proxy server for PMU API
// Use this if Vite proxy doesn't work
// FIX: Updated to use correct PMU API endpoint

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// FIX: Corrected PMU API base URL (online instead of offline, client/1 instead of client/7)
const PMU_API_BASE = 'https://online.turfinfo.api.pmu.fr/rest/client/1';

// Enable CORS for all origins (restrict in production)
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    pmu_api: PMU_API_BASE
  });
});

// Proxy endpoint
app.get('/api/*', async (req, res) => {
  // Remove /api prefix to get the actual path
  const path = req.path.replace('/api', '');
  const targetUrl = `${PMU_API_BASE}${path}`;

  console.log(`[${new Date().toISOString()}] Proxying request to: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`PMU API returned ${response.status}: ${response.statusText}`);

      // FIX: Include response body in error for debugging
      const errorBody = await response.text();

      return res.status(response.status).json({
        error: `PMU API returned ${response.status}`,
        details: errorBody,
        url: targetUrl
      });
    }

    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Success: ${Object.keys(data).length} keys in response`);
    res.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy server error',
      message: error.message,
      url: targetUrl
    });
  }
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  PMU API Proxy Server                                          ║
╠════════════════════════════════════════════════════════════════╣
║  Status: Running                                               ║
║  Port: ${PORT}                                                    ║
║  Target: ${PMU_API_BASE}  ║
╠════════════════════════════════════════════════════════════════╣
║  Example Usage:                                                ║
║  http://localhost:${PORT}/api/programme/25012026                  ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// INSTALLATION:
// npm install express cors

// RUN:
// node proxy-server.js

// UPDATE pmuApi.js IF NEEDED:
// const BASE_URL = 'http://localhost:3001/api';