# Installation Guide - Betting System

## Files to Install

### Backend Files

### 1. Migrations (database/migrations/)
Copy these files to `database/migrations/`:
- `2024_01_28_000001_create_daily_bets_table.php`
- `2024_01_28_000002_create_value_bets_table.php`
- `2024_01_28_000003_create_bet_combinations_table.php`
- `2024_01_28_000004_create_race_results_table.php`

### 2. Models (app/Models/)
Copy these files to `app/Models/`:
- `DailyBet.php`
- `ValueBet.php`
- `BetCombination.php`
- `RaceResult.php`

### 3. Services (app/Services/)
Copy these files to `app/Services/`:
- `BettingService.php`
- `PMUResultsService.php`

### 4. Commands (app/Console/Commands/)
Copy these files to `app/Console/Commands/`:
- `FetchPreviousDayResults.php`
- `GenerateDailyReport.php`

### 5. Controller (app/Http/Controllers/Api/)
Copy this file to `app/Http/Controllers/Api/`:
- `BettingController.php`

### 6. Routes
Replace your `routes/api.php` with the provided `api.php` file
OR manually add the betting routes to your existing `routes/api.php`

### Frontend Files

### 7. Vue Component (src/components/)
Copy this file to `src/components/`:
- `BettingReport.vue`

### 8. Service Update (src/services/)
Replace your `src/services/pmuApi.js` with the provided `pmuApi.js` file
OR manually add the betting methods to your existing service

### 9. App Update (src/)
Replace your `src/App.vue` with the provided `App.vue` file
OR manually add the BettingReport import and navigation

## Installation Steps

### Backend Installation

### Step 1: Copy Files
```bash
# From your project root
cd /path/to/par_mutuel_urbain_back

# Copy migrations
cp /path/to/betting_system/2024_01_28_*.php database/migrations/

# Copy models
cp /path/to/betting_system/DailyBet.php app/Models/
cp /path/to/betting_system/ValueBet.php app/Models/
cp /path/to/betting_system/BetCombination.php app/Models/
cp /path/to/betting_system/RaceResult.php app/Models/

# Copy services
cp /path/to/betting_system/BettingService.php app/Services/
cp /path/to/betting_system/PMUResultsService.php app/Services/

# Copy commands
cp /path/to/betting_system/FetchPreviousDayResults.php app/Console/Commands/
cp /path/to/betting_system/GenerateDailyReport.php app/Console/Commands/

# Copy controller
cp /path/to/betting_system/BettingController.php app/Http/Controllers/Api/
```

### Step 2: Run Migrations
```bash
php artisan migrate
```

### Step 3: Add Routes
If you replaced `routes/api.php`, you're done.

Otherwise, add these routes to your existing `routes/api.php`:
```php
use App\Http\Controllers\Api\BettingController;

Route::prefix('pmu')->middleware('throttle:120,1')->group(function () {
    // ... existing routes ...
    
    Route::prefix('betting')->group(function () {
        Route::post('/process-predictions', [BettingController::class, 'processPredictions']);
        Route::get('/daily-bets', [BettingController::class, 'getDailyBets']);
        Route::get('/value-bets', [BettingController::class, 'getValueBets']);
        Route::get('/combinations', [BettingController::class, 'getCombinations']);
        Route::post('/fetch-results', [BettingController::class, 'fetchResults']);
        Route::get('/race-results', [BettingController::class, 'getRaceResults']);
        Route::get('/generate-report', [BettingController::class, 'generateReport']);
    });
});
```

### Step 4: Create Reports Directory
```bash
mkdir -p storage/app/reports
```

### Frontend Installation

### Step 5: Copy Vue Files
```bash
# From your frontend project root
cd /path/to/par_mutuel_urbain

# Copy component
cp /path/to/betting_system/BettingReport.vue src/components/

# Copy updated service (or merge manually)
cp /path/to/betting_system/pmuApi.js src/services/

# Copy updated App.vue (or merge manually)
cp /path/to/betting_system/App.vue src/
```

### Step 6: Manual Integration (if not replacing files)

If you don't want to replace `App.vue`, add these changes manually:

**In src/App.vue:**
```javascript
// Add import
import BettingReport from './components/BettingReport.vue'

// Add to template
<button
  :class="{ active: currentView === 'betting' }"
  @click="currentView = 'betting'"
>
  📊 Rapport Paris
</button>

// Add component
<BettingReport v-else-if="currentView === 'betting'" />
```

**In src/services/pmuApi.js:**
Add these methods to the pmuApi object:
```javascript
// Get daily bets
async getDailyBets(date = null) {
  const dateParam = date || new Date().toISOString().split('T')[0];
  const url = `${BASE_URL}/betting/daily-bets?date=${dateParam}`;
  const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
},

// Get betting report
async getBettingReport(date = null) {
  const dateParam = date || new Date().toISOString().split('T')[0];
  const url = `${BASE_URL}/betting/generate-report?date=${dateParam}`;
  const response = await fetchWithTimeout(url, {}, DEFAULT_TIMEOUT);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}
```

### Step 7: Test Installation
```bash
# Backend tests
php artisan betting:fetch-results --help
php artisan betting:generate-report --help

# Test API endpoints
curl http://localhost:8000/api/pmu/betting/daily-bets?date=2024-01-28
curl http://localhost:8000/api/pmu/betting/generate-report?date=2024-01-28

# Frontend tests
# Start your frontend dev server
npm run dev
# Navigate to "📊 Rapport Paris" tab
# Should display betting report with all sections
```

## Usage Flow

### Daily Workflow

#### 1. Process Today's Predictions
When you generate predictions for today, send them to:
```bash
POST /api/pmu/betting/process-predictions
```

This will:
- Store all bets with probability > 40%
- Store top 20 value bets
- Generate combinations automatically

#### 2. Next Day - Fetch Results
Run this command every morning:
```bash
php artisan betting:fetch-results
```

This will:
- Fetch race results from PMU API
- Store results in database
- Mark bets as processed

#### 3. Generate Report
```bash
php artisan betting:generate-report
```

This will:
- Calculate performance metrics
- Generate comprehensive report
- Save report to storage/app/reports/

## Scheduled Tasks

Add to `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Fetch results every day at 8 AM
    $schedule->command('betting:fetch-results')
             ->dailyAt('08:00')
             ->timezone('Europe/Paris');
    
    // Generate report every day at 8:30 AM
    $schedule->command('betting:generate-report')
             ->dailyAt('08:30')
             ->timezone('Europe/Paris');
}
```

Then ensure your cron is running:
```bash
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

## Verification

After installation, verify:

```bash
# Check migrations
php artisan migrate:status

# List commands
php artisan list | grep betting

# Test daily bets endpoint
curl http://localhost:8000/api/pmu/betting/daily-bets?date=$(date +%Y-%m-%d)

# Test value bets endpoint
curl http://localhost:8000/api/pmu/betting/value-bets?date=$(date +%Y-%m-%d)
```

## Troubleshooting

### Issue: Migrations fail
Solution: Check database connection in `.env`

### Issue: Commands not found
Solution: Run `composer dump-autoload`

### Issue: API endpoints return 404
Solution: Clear route cache with `php artisan route:clear`

### Issue: No results fetched
Solution: Check PMU API connectivity and race_id resolution in database

## Next Steps

1. Integrate prediction generation with `POST /api/pmu/betting/process-predictions`
2. Set up scheduled tasks for automatic fetching and reporting
3. Monitor reports in `storage/app/reports/`
4. Adjust probability thresholds if needed in models
