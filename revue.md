# REVUE DE CODE COMPLETE - PROJET PMU

---

## 1. PMUFetcherService.php

### Ligne 10: BASE_URL sans protocole
```php
private const BASE_URL = 'online.turfinfo.api.pmu.fr/rest/client/1';
```
**Problème:** Manque `https://`  
**Impact:** Toutes les requêtes HTTP échouent  
**Fix:**
```php
private const BASE_URL = 'https://online.turfinfo.api.pmu.fr/rest/client/1';
```

### Ligne 22-25: fetchCourse() endpoint incomplet
```php
public function fetchCourse(string $date, int $reunionNum, int $courseNum): ?array
{
    return $this->doFetch("/programme/{$date}/R{$reunionNum}/C{$courseNum}/participants");
}
```
**Problème:** `/participants` retourne SEULEMENT les chevaux, PAS hippodrome/distance/discipline  
**Impact:** En BDD hippodrome=NULL, distance=NULL, discipline=NULL  
**Fix:**
```php
public function fetchCourse(string $date, int $reunionNum, int $courseNum): ?array
{
    $courseInfo = $this->doFetch("/programme/{$date}/R{$reunionNum}/C{$courseNum}");
    $participants = $this->doFetch("/programme/{$date}/R{$reunionNum}/C{$courseNum}/participants");
    
    if (!$courseInfo || !$participants) {
        return null;
    }
    
    return array_merge($courseInfo, ['participants' => $participants['participants'] ?? []]);
}
```

---

## 2. PMUStorageService.php

### Ligne 62-70: setTime() modifie $raceDate
```php
if (isset($data['heureDepart'])) {
    $time = str_pad($data['heureDepart'], 4, '0', STR_PAD_LEFT);
    if (strlen($time) === 4 && ctype_digit($time)) {
        $hour = (int)substr($time, 0, 2);
        $minute = (int)substr($time, 2, 2);
        if ($hour >= 0 && $hour <= 23 && $minute >= 0 && $minute <= 59) {
            $raceDate->setTime($hour, $minute);  // ← Modifie $raceDate
        }
    }
}
```
**Problème:** `$raceDate` est modifié puis utilisé ligne 92 dans updateOrCreate  
**Impact:** Chaque fetch avec heure différente crée un doublon

### Ligne 89-100: updateOrCreate avec DATETIME
```php
return Race::updateOrCreate(
    [
        'race_code' => "R{$reunionNum}C{$courseNum}",
        'race_date' => $raceDate  // ← Contient DATE + HEURE
    ],
    [
        'hippodrome' => $hippodrome,
        'distance' => $this->validateDistance($data['distance'] ?? null),
        'discipline' => $data['discipline'] ?? null,
        'track_condition' => $data['penetrometre'] ?? null
    ]
);
```
**Problème:** `race_date` contient DATETIME complet, donc chaque fetch avec heure légèrement différente crée une nouvelle course  
**Impact:** Doublons R5C10 avec timestamps 14:30:00, 14:31:00, etc.  
**Fix:**
```php
// Séparer heure
$startTime = null;
if (isset($data['heureDepart'])) {
    $time = str_pad($data['heureDepart'], 4, '0', STR_PAD_LEFT);
    if (strlen($time) === 4 && ctype_digit($time)) {
        $hour = (int)substr($time, 0, 2);
        $minute = (int)substr($time, 2, 2);
        if ($hour >= 0 && $hour <= 23 && $minute >= 0 && $minute <= 59) {
            $startTime = clone $raceDate;
            $startTime->setTime($hour, $minute);
        }
    }
}

return Race::updateOrCreate(
    [
        'race_code' => "R{$reunionNum}C{$courseNum}",
        'race_date' => $raceDate->format('Y-m-d')  // DATE SEULEMENT
    ],
    [
        'hippodrome' => $hippodrome,
        'distance' => $this->validateDistance($data['distance'] ?? null),
        'discipline' => $data['discipline'] ?? null,
        'track_condition' => $data['penetrometre'] ?? null,
        'start_time' => $startTime ? $startTime->format('H:i:s') : null
    ]
);
```

### Ligne 109, 114: firstOrCreate sans validation
```php
$jockey = Jockey::firstOrCreate(['name' => $participant['driver']]);
$trainer = Trainer::firstOrCreate(['name' => $participant['entraineur']]);
```
**Problème:** Si 2 jockeys ont un nom similaire (ex: "J. Smith", "John Smith"), crée des doublons  
**Qualité:** Pas de gestion de doublons, pas de normalisation des noms  
**Suggestion:** Ajouter normalisation ou ID unique

### Ligne 172: Pas de validation idCheval
```php
$horseId = $participant['idCheval'];
```
**Problème:** Si `idCheval` est null/vide, crash  
**Qualité:** Déjà validé ligne 251 dans validateParticipant(), mais dépendance implicite  
**Suggestion:** Ajouter assertion

### Ligne 177, 191: N+1 queries potentielles
```php
$father = Horse::where('name', $participant['nomPere'])->first();
if (!$father) {
    $father = Horse::firstOrCreate(...);
}
```
**Problème:** Pour chaque participant, query séparée pour père/mère  
**Performance:** Si 16 chevaux, 32 queries supplémentaires  
**Suggestion:** Eager load ou batch lookup

---

## 3. PMUResultsService.php

### Ligne 290-297: findRaceId ne filtre pas par numéro
```php
public function findRaceId(string $date, string $hippodrome, int $raceNumber): ?int
{
    $race = \App\Models\Race::whereDate('race_date', $date)
        ->where('hippodrome', 'LIKE', "%{$hippodrome}%")
        ->first();  // ← Retourne N'IMPORTE QUELLE course

    return $race ? $race->id : null;
}
```
**Problème:**  
1. Ne filtre pas par `$raceNumber`  
2. Retourne première course trouvée (peut être R5C1 au lieu de R5C10)  
3. Avec Bug #2 (doublons), toujours la première

**Impact:** Résultats associés à la mauvaise course ou pas du tout  
**Fix:**
```php
public function findRaceId(string $date, string $hippodrome, int $raceNumber): ?int
{
    $races = \App\Models\Race::whereDate('race_date', $date)
        ->where('hippodrome', 'LIKE', "%{$hippodrome}%")
        ->get();
    
    foreach ($races as $race) {
        if (preg_match('/C(\d+)$/', $race->race_code, $matches)) {
            if ((int)$matches[1] === $raceNumber) {
                return $race->id;
            }
        }
    }
    
    return $races->first()?->id;
}
```

---

## 4. FetchPreviousDayResults.php

### Ligne 20: BettingService instancié sans argument
```php
$bettingService = new BettingService();
$results = $bettingService->fetchPreviousDayResults();
```
**Problème:** BettingService::__construct() REQUIERT PMUResultsService  
**Impact:** FATAL ERROR - ArgumentCountError  
**Fix:**
```php
$bettingService = app(BettingService::class);
// OU
$bettingService = new BettingService(app(PMUResultsService::class));
```

---

## 5. Race.php Model

### Ligne 10-17: fillable manque start_time
```php
protected $fillable = [
    'race_date',
    'hippodrome',
    'distance',
    'discipline',
    'track_condition',
    'race_code'
    // start_time MANQUE
];
```
**Problème:** Après fix de PMUStorageService, start_time ne peut pas être mass-assigned  
**Fix:** Ajouter `'start_time'`

### Ligne 19-21: Cast datetime incorrect
```php
protected $casts = [
    'race_date' => 'datetime'
];
```
**Problème:** Après fix, race_date devient DATE seule (sans heure)  
**Fix:**
```php
protected $casts = [
    'race_date' => 'date',
    'start_time' => 'datetime:H:i'
];
```

---

## 6. PMUController.php

### Ligne 27, 50: Cache 30 minutes
```php
private const CACHE_RACES = 1800;  // 30 min

$races = Cache::remember($cacheKey, self::CACHE_RACES, function() use ($date) {
    return Race::whereDate('race_date', $date)->get();
});
```
**Problème:**  
1. Si front appelle API AVANT import → cache stocke `[]`  
2. Même après import, API retourne `[]` pendant 30 min

**Impact:** Front affiche "0 courses" alors qu'elles sont en BDD  
**Fix:**  
**Option 1:** Invalider cache après import
```php
// Dans FetchPMUDataJob après import
Cache::forget("races_by_date_{$date}");
```
**Option 2:** Réduire durée
```php
private const CACHE_RACES = 60;  // 1 min
```

---

## 7. FetchPMUDataJob.php

### Ligne 93-123: Pas de nettoyage avant fetch
```php
private function fetchFullProgramme(PMUFetcherService $fetcher, PMUStorageService $storage): void
{
    $programme = $fetcher->fetchProgramme($this->date);
    // Directement itère et stocke
}
```
**Problème:** Ne supprime PAS les anciennes courses avant de fetch  
**Impact:** Combiné avec Bug #2 (doublons), accumule les courses  
**Fix:**
```php
private function fetchFullProgramme(PMUFetcherService $fetcher, PMUStorageService $storage): void
{
    // Nettoyer anciennes courses
    $parsedDate = \DateTime::createFromFormat('dmY', $this->date);
    if ($parsedDate) {
        $dateStr = $parsedDate->format('Y-m-d');
        \App\Models\Race::whereDate('race_date', $dateStr)->delete();
        Log::info("Cleaned existing races for {$dateStr}");
    }

    $programme = $fetcher->fetchProgramme($this->date);
    // ... reste
}
```

---

## 8. PMUController_resolveRaceId.php

### Fichier entier
```
app/Http/Controllers/Api/PMUController.php (446 lignes)
app/Http/Controllers/Api/PMUController_resolveRaceId.php (111 lignes)
```
**Problème:** Deux fichiers définissent `class PMUController`  
**Impact:** PHP charge l'un ou l'autre de façon aléatoire → comportement imprévisible  
**Fix:** Supprimer le doublon ou fusionner

---

## 9. Migration create_races_table.php

### Ligne 14-26: Pas de contrainte unique
```php
Schema::create('races', function (Blueprint $table) {
    $table->id();
    $table->dateTime('race_date');
    $table->string('race_code')->nullable();
    // ... pas de unique(['race_code', 'race_date'])
});
```
**Problème:** BDD PERMET les doublons  
**Impact:** Même avec fix applicatif, rien n'empêche les doublons  
**Fix:**
```php
$table->date('race_date');  // DATE pas DATETIME
$table->time('start_time')->nullable();
$table->unique(['race_code', 'race_date']);
```

---

## SYNTHESE DES BUGS PAR SEVERITE

### BLOQUANTS (empêchent l'exécution)
1. **PMUFetcherService ligne 10:** URL sans https:// → toutes requêtes échouent
2. **FetchPreviousDayResults ligne 20:** new BettingService() sans arg → crash

### CRITIQUES (données incorrectes)
3. **PMUStorageService ligne 89-92:** race_date avec DATETIME → doublons systématiques
4. **PMUFetcherService ligne 24:** endpoint /participants → données NULL en BDD
5. **PMUResultsService ligne 292-294:** findRaceId ne filtre pas → résultats sur mauvaise course
6. **PMUController_resolveRaceId:** Fichier dupliqué → comportement aléatoire

### MAJEURS (impact fonctionnel)
7. **PMUController ligne 50:** Cache 30min → retourne [] même après import
8. **FetchPMUDataJob ligne 93:** Pas de nettoyage → accumule doublons
9. **Migration races:** Pas de contrainte unique → permet doublons

### MINEURS (qualité/performance)
10. **Race model ligne 10, 20:** fillable et cast incorrects
11. **PMUStorageService ligne 177, 191:** N+1 queries pour père/mère chevaux
12. **PMUStorageService ligne 109, 114:** Pas de normalisation jockey/trainer

---

## ORDRE DE CORRECTION RECOMMANDE

### Phase 1: Fixes bloquants (sinon rien ne marche)
1. PMUFetcherService: Ajouter https://
2. FetchPreviousDayResults: app(BettingService::class)

### Phase 2: Fixes critiques (données)
3. Migration: ALTER TABLE races (date, start_time, unique)
4. Race model: Modifier fillable et casts
5. PMUStorageService: Utiliser date seule dans updateOrCreate
6. PMUFetcherService: Appeler 2 endpoints dans fetchCourse
7. PMUResultsService: Filtrer par race_number dans findRaceId
8. Supprimer PMUController_resolveRaceId.php

### Phase 3: Fixes majeurs (fonctionnel)
9. PMUController: Invalider cache après import OU réduire durée
10. FetchPMUDataJob: Nettoyer avant fetch

### Phase 4: Nettoyage BDD
11. Supprimer doublons existants
12. Réimporter données proprement

### Phase 5: Optimisations (optionnel)
13. Eager loading père/mère dans createHorse
14. Normalisation noms jockey/trainer

---

## TESTS DE VALIDATION

```bash
# Test 1: Pas de doublons après 2 fetch
php artisan pmu:fetch --sync
COUNT1=$(php artisan tinker --execute="echo \App\Models\Race::count();" | tail -1)
php artisan pmu:fetch --sync  
COUNT2=$(php artisan tinker --execute="echo \App\Models\Race::count();" | tail -1)
# $COUNT1 doit égaler $COUNT2

# Test 2: Courses avec données
php artisan tinker --execute="
\$race = \App\Models\Race::first();
if (\$race->hippodrome && \$race->distance) {
    echo 'OK';
} else {
    echo 'FAIL';
}
"

# Test 3: Résultats récupérés
curl -X POST http://localhost:8000/api/pmu/betting/fetch-results
COUNT=$(php artisan tinker --execute="echo \App\Models\RaceResult::count();" | tail -1)
# $COUNT doit être > 0

# Test 4: Cache invalide
curl http://localhost:8000/api/pmu/races?date=2026-02-02
# Doit retourner courses, pas []
```

---

FIN DE LA REVUE