# Betting System Documentation

## Overview

This betting system stores high-probability bets, value bets, generates combinations, and produces daily reports.

## Features

1. **Daily Bets Storage**: Stores all bets with probability > 40%
2. **Value Bets**: Tracks top 20 value bets based on Kelly Criterion
3. **Combinations**: Automatically generates COUPLE and TRIO combinations for horses in the same race
4. **Results Fetching**: Retrieves final race results from PMU API
5. **Daily Reports**: Generates comprehensive betting performance reports

## Database Tables

### daily_bets
Stores all bets with probability > 40%
- bet_date: Date of the bet
- race_id: Race identifier
- horse_id: Horse identifier
- probability: Winning probability
- odds: Offered odds
- bet_type: Type of bet (SIMPLE, COUPLE, etc)

### value_bets
Stores top 20 value bets
- bet_date: Date of the bet
- race_id: Race identifier
- horse_id: Horse identifier
- estimated_probability: Estimated winning probability
- offered_odds: Offered odds
- value_score: Kelly value score
- ranking: Rank from 1 to 20

### bet_combinations
Stores coupled bets for horses in same race
- bet_date: Date of the bet
- race_id: Race identifier
- combination_type: COUPLE, COUPLE_GAGNANT, TRIO
- horses: JSON array of horse IDs and names
- combined_probability: Combined probability

### race_results
Stores final race results
- race_id: Race identifier
- race_date: Date of the race
- hippodrome: Race track name
- final_rankings: JSON array with final positions
- rapports: JSON object with PMU payouts

## API Endpoints

### Process Predictions
```
POST /api/pmu/betting/process-predictions
```
Store daily bets and value bets from predictions

**Request Body:**
```json
{
  "date": "2024-01-28",
  "predictions": [
    {
      "race_id": 1,
      "horse_id": "H123",
      "horse_name": "Champion",
      "probability": 0.45,
      "odds": 3.5,
      "metadata": {}
    }
  ]
}
```

### Get Daily Bets
```
GET /api/pmu/betting/daily-bets?date=2024-01-28
```

### Get Value Bets
```
GET /api/pmu/betting/value-bets?date=2024-01-28
```

### Get Combinations
```
GET /api/pmu/betting/combinations?date=2024-01-28
```

### Fetch Results
```
POST /api/pmu/betting/fetch-results
```
Fetches race results for previous day from PMU API

### Generate Report
```
GET /api/pmu/betting/generate-report?date=2024-01-28
```
Generates comprehensive daily report

## Artisan Commands

### Fetch Previous Day Results
```bash
php artisan betting:fetch-results [date]
```
Fetches race results from PMU API for specified date (default: yesterday)

### Generate Daily Report
```bash
php artisan betting:generate-report [date]
```
Generates betting report for specified date (default: yesterday)

## Workflow

### 1. Daily Betting Process
```bash
# Store predictions (probability > 40% and top 20 value bets)
curl -X POST http://localhost:8000/api/pmu/betting/process-predictions \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-28", "predictions": [...]}'

# This will:
# - Store all bets with probability > 40%
# - Store top 20 value bets
# - Generate all combinations
```

### 2. Next Day - Fetch Results
```bash
# Fetch results from PMU API
php artisan betting:fetch-results

# Or via API
curl -X POST http://localhost:8000/api/pmu/betting/fetch-results
```

### 3. Generate Report
```bash
# Generate report
php artisan betting:generate-report

# Or via API
curl http://localhost:8000/api/pmu/betting/generate-report?date=2024-01-28
```

## Report Structure

The daily report includes:

### Summary
- Total daily bets
- Total value bets
- Total combinations
- Winning bets count
- Total invested
- Total returns
- Net profit
- ROI percentage

### Daily Bets Section
For each bet with probability > 40%:
- Horse information
- Probability
- Odds
- Win/Loss status
- Payout if won

### Value Bets Section
For each of top 20 value bets:
- Ranking
- Horse information
- Estimated probability
- Offered odds
- Value score
- Win/Loss status
- Payout if won

### Combinations Section
For each combination:
- Combination type (COUPLE, TRIO)
- Horses involved
- Combined probability
- Win/Loss status
- Payout if won

### Race Results
For each race:
- Hippodrome
- Race number
- Winner and top 3
- All PMU payouts

## Scheduled Tasks

Add to `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Fetch results every day at 8 AM
    $schedule->command('betting:fetch-results')
             ->dailyAt('08:00');
    
    // Generate report every day at 8:30 AM
    $schedule->command('betting:generate-report')
             ->dailyAt('08:30');
}
```

## Example Usage

### Store Today's Predictions
```javascript
const predictions = [
  {
    race_id: 1,
    horse_id: "H123",
    horse_name: "Champion",
    probability: 0.45,
    odds: 3.5
  },
  // More predictions...
];

await fetch('/api/pmu/betting/process-predictions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2024-01-28',
    predictions: predictions
  })
});
```

### View Today's Bets
```javascript
// Get daily bets (probability > 40%)
const dailyBets = await fetch('/api/pmu/betting/daily-bets?date=2024-01-28')
  .then(r => r.json());

// Get value bets (top 20)
const valueBets = await fetch('/api/pmu/betting/value-bets?date=2024-01-28')
  .then(r => r.json());

// Get combinations
const combinations = await fetch('/api/pmu/betting/combinations?date=2024-01-28')
  .then(r => r.json());
```

### Generate Report for Yesterday
```javascript
const report = await fetch('/api/pmu/betting/generate-report?date=2024-01-27')
  .then(r => r.json());

console.log('ROI:', report.data.summary.roi + '%');
console.log('Net Profit:', report.data.summary.net_profit);
```
