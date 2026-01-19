// Simple Node.js proxy server for PMU API
// Use this if Vite proxy doesn't work

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all origins (restrict in production)
app.use(cors());

// Proxy endpoint
app.get('/api/*', async (req, res) => {
  const path = req.path.replace('/api', '');
  const targetUrl = `https://offline.turfinfo.api.pmu.fr${path}`;
  
  console.log(`Proxying request to: ${targetUrl}`);
  
  try {
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: `PMU API returned ${response.status}`
      });
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Forward requests to: http://localhost:${PORT}/api/rest/client/7/programme/...`);
});

// INSTALLATION:
// npm install express cors

// RUN:
// node proxy-server.js

// UPDATE pmuApi.js:
// const BASE_URL = 'http://localhost:3001/api/rest/client/7/programme';
