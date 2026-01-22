# 🎯 Projet PMU - Organisation Complète

## 📦 Fichiers Livrés

### 🔧 Backend Laravel (9 fichiers)

#### Services (3 nouveaux)
1. **ValueBetService.php** - Calcul Kelly Criterion
   - Calcule les mises optimales
   - Analyse les value bets d'une course
   
2. **CombinationService.php** - Générateur de combinaisons
   - Tiercé ordre/désordre
   - Quinté désordre
   - Calcul EV par combinaison

3. **PMUFetcherService.php** - ✅ Déjà fourni (amélioré avec logs)

#### Controllers (1 remplacé)
4. **PMUController.php** - Controller unifié
   - Toutes les routes programme + analyses
   - Intégration ValueBets + Combinaisons

#### Routes (1 remplacé)
5. **api.php** - Routes complètes
   - Routes programme PMU (API publique)
   - Routes analyses (value bets, tiercé, quinté)
   - Validation des paramètres

#### Config (2 améliorés)
6. **cors.php** - CORS configurable via .env
7. **.env.example** - Variables d'environnement
8. **Horse.php** - Model optimisé (requêtes SQL)

#### Providers
9. **AppServiceProvider.php** - Enregistrement services

---

### 🎨 Frontend Vue.js (4 fichiers)

#### Composables (3 fichiers)
1. **usePMU.js** - Gestion programme PMU
   - Chargement programme/réunions/courses
   - Fetch depuis API publique via backend
   - Timeout 10s

2. **useValueBets.js** - Value bets
   - Fetch value bets avec Kelly
   - Gestion état et erreurs

3. **useCombinations.js** - Combinaisons
   - Fetch Tiercé/Quinté
   - Gestion combinaisons

#### Composants (1 remplacé)
4. **PMURaces.vue** - Interface complète
   - Affichage programme PMU
   - Onglets Value Bets / Tiercé / Quinté
   - Interface responsive

#### Config (1 corrigé)
5. **vite.config.js** - Proxy vers Laravel

---

## 🚀 Comment ça Fonctionne

### Architecture du Flux

```
┌─────────────┐
│  Frontend   │ (Vue.js - Port 3000)
│  PMURaces   │
└──────┬──────┘
       │ HTTP Request via Proxy
       ▼
┌─────────────┐
│  Backend    │ (Laravel - Port 8000)
│ PMUController│
└──────┬──────┘
       │
       ├─► PMUFetcherService ──► API PMU Externe (programme)
       │
       ├─► PMUStatisticsService ──► Calculs probabilités
       │
       ├─► ValueBetService ──► Kelly Criterion
       │
       └─► CombinationService ──► Tiercé/Quinté
```

### Flux de Données

1. **User clique "Charger programme"**
   ```
   Frontend → GET /api/pmu/22012025
   Backend → Fetch API PMU → Cache → Return JSON
   Frontend → Affiche réunions
   ```

2. **User sélectionne une course**
   ```
   Frontend → GET /api/pmu/22012025/R1/C1/participants
   Backend → Fetch API PMU → Return participants
   Frontend → Affiche chevaux
   ```

3. **User clique "Voir analyses" > Value Bets**
   ```
   Frontend → GET /api/pmu/races/1/value-bets?bankroll=1000
   Backend → PMUStatisticsService calcule probas
          → ValueBetService calcule Kelly
          → Return value bets
   Frontend → Affiche mises optimales
   ```

4. **User clique "Générer" Tiercé**
   ```
   Frontend → GET /api/pmu/races/1/combinations/tierce
   Backend → PMUStatisticsService calcule probas
          → CombinationService génère combinaisons
          → Return top 10
   Frontend → Affiche combinaisons triées
   ```

---

## 📋 Installation Rapide

### Backend (5 minutes)

```bash
cd backend/par_mutuel_urbain_back

# 1. Copier fichiers
cp ValueBetService.php app/Services/
cp CombinationService.php app/Services/
cp PMUController.php app/Http/Controllers/Api/
cp api.php routes/
cp cors.php config/
cp Horse.php app/Models/

# 2. Éditer AppServiceProvider.php (ajouter les services)

# 3. Configurer .env
echo "FRONTEND_URL=http://localhost:3000" >> .env

# 4. Setup
composer install
php artisan migrate
php artisan config:cache

# 5. Démarrer
php artisan serve
```

### Frontend (2 minutes)

```bash
cd frontend/par_mutuel_urbain

# 1. Copier fichiers
cp vite.config.js .
cp usePMU.js src/composables/
cp useValueBets.js src/composables/
cp useCombinations.js src/composables/
cp PMURaces.vue src/components/

# 2. Installer et démarrer
npm install
npm run dev
```

**C'est prêt !** → http://localhost:3000

---

## ✨ Nouvelles Fonctionnalités

### Avant ❌
- Programme PMU uniquement
- Pas d'analyses
- Pas de recommandations

### Après ✅
- ✅ Programme PMU (fetch API publique)
- ✅ **Value Bets avec Kelly Criterion**
  - Calcul mises optimales
  - EV en temps réel
  - Bankroll management
- ✅ **Combinaisons Tiercé**
  - Ordre/Désordre
  - Top 10 combinaisons
  - Probabilités calculées
- ✅ **Combinaisons Quinté**
  - Désordre
  - Top 10 combinaisons
  - EV par combinaison
- ✅ Interface intuitive avec onglets

---

## 🎯 Endpoints API Disponibles

### Programme (API PMU publique via proxy)
```
GET /api/pmu/{date}                                 # Programme jour
GET /api/pmu/{date}/R{reunionNum}                   # Réunion
GET /api/pmu/{date}/R{R}/C{C}/participants          # Participants
```

### Analyses (Nouveaux)
```
GET /api/pmu/races/{id}/predictions                 # Prédictions base
GET /api/pmu/races/{id}/value-bets?bankroll=1000    # Kelly
GET /api/pmu/races/{id}/combinations/tierce         # Tiercé
GET /api/pmu/races/{id}/combinations/quinte         # Quinté
```

---

## 🔍 Tests Rapides

### Test Backend
```bash
# Health check
curl http://localhost:8000/api/pmu/health

# Programme aujourd'hui
curl http://localhost:8000/api/pmu/$(date +%d%m%Y)

# Value bets (nécessite race ID)
curl http://localhost:8000/api/pmu/races/1/value-bets?bankroll=1000
```

### Test Frontend
1. Ouvrir http://localhost:3000
2. Cliquer "Charger le programme"
3. Sélectionner une réunion > une course
4. Cliquer "Voir analyses"
5. Tester les 3 onglets

---

## 📊 Exemple de Données

### Value Bet Response
```json
{
  "race_id": 1,
  "bankroll": 1000,
  "value_bets": [
    {
      "horse_name": "Lightning Bolt",
      "probability": 35.5,
      "odds": 4.2,
      "kelly_data": {
        "recommended_stake": 32.50,
        "expected_value": 12.8
      }
    }
  ],
  "summary": {
    "count": 3,
    "total_stake": 85.75
  }
}
```

### Tiercé Response
```json
{
  "type": "TIERCE_DESORDRE",
  "combinations": [
    {
      "horses": ["Horse1", "Horse2", "Horse3"],
      "probability": 8.45,
      "ev_analysis": {
        "expected_value": 2.40,
        "ev_percentage": 120.0
      }
    }
  ]
}
```

---

## 🛠 Personnalisation

### Changer les paramètres par défaut

**Backend** - `PMUController.php`
```php
// Ligne ~150 - Bankroll par défaut
$bankroll = $request->query('bankroll', 1000); // Changer 1000

// Ligne ~180 - Nombre de combinaisons
$limit = $request->query('limit', 10); // Changer 10
```

**Frontend** - `PMURaces.vue`
```javascript
// Ligne ~30 - Bankroll par défaut
const bankroll = ref(1000); // Changer 1000

// Ligne ~33 - Ordre Tiercé par défaut
const tierceOrdre = ref(false); // true pour ordre
```

---

## 🐛 Troubleshooting

| Problème | Solution |
|----------|----------|
| CORS Error | Vérifier FRONTEND_URL dans .env + config:clear |
| 404 Routes | php artisan route:clear |
| Services not found | Vérifier AppServiceProvider + dump-autoload |
| Frontend 504 | Backend non démarré (php artisan serve) |
| Proxy error | Vérifier vite.config.js target |

---

## 📚 Documentation Complète

Tous les détails dans :
- **INSTALLATION_COMPLETE.md** - Guide pas à pas
- **ANALYSE_ALGORITHME.md** - Analyse complète de l'algo
- **rapport_bugs.md** - Bugs identifiés et corrigés

---

## 🎓 Concepts Clés

### Kelly Criterion
Formule mathématique pour calculer la mise optimale :
```
Kelly = (bp - q) / b
où:
  b = cote - 1 (gain net)
  p = probabilité de gagner
  q = probabilité de perdre (1-p)
```

### Expected Value (EV)
Gain moyen attendu par mise :
```
EV = (proba × gain) - (proba_perte × mise)
EV% = (EV / mise) × 100
```

Un EV positif = value bet rentable

### Combinaisons
- **Tiercé Ordre** : 3 chevaux dans l'ordre exact (A-B-C)
- **Tiercé Désordre** : 3 chevaux dans n'importe quel ordre (6 possibilités)
- **Quinté Désordre** : 5 chevaux dans n'importe quel ordre (120 possibilités)

---

## 🚀 Prochaines Étapes

1. ✅ **Installation** - Suivre INSTALLATION_COMPLETE.md
2. ✅ **Test** - Vérifier que tout fonctionne
3. 🔄 **Données réelles** - Connecter à votre BDD de courses
4. 📈 **Backtesting** - Valider l'algo sur historique
5. 🎨 **UI/UX** - Personnaliser l'interface
6. 🔐 **Auth** - Ajouter authentification Sanctum
7. 📱 **Mobile** - Responsive design amélioré

---

## ✅ Checklist Complète

**Backend**
- [ ] ValueBetService.php copié
- [ ] CombinationService.php copié
- [ ] PMUController.php remplacé
- [ ] api.php remplacé
- [ ] cors.php remplacé
- [ ] AppServiceProvider.php modifié
- [ ] .env configuré (FRONTEND_URL)
- [ ] composer install
- [ ] php artisan migrate
- [ ] php artisan serve ✓

**Frontend**
- [ ] vite.config.js remplacé
- [ ] usePMU.js copié
- [ ] useValueBets.js copié
- [ ] useCombinations.js copié
- [ ] PMURaces.vue remplacé
- [ ] npm install
- [ ] npm run dev ✓

**Tests**
- [ ] Backend health check ✓
- [ ] Programme chargé ✓
- [ ] Value bets fonctionne ✓
- [ ] Tiercé fonctionne ✓
- [ ] Quinté fonctionne ✓

---

## 🎉 Résultat Final

Vous avez maintenant une application PMU complète avec :
- Chargement programme en temps réel
- Analyses avancées (Kelly Criterion)
- Génération de combinaisons rentables
- Interface utilisateur intuitive
- Architecture scalable et maintenable

**Bon développement ! 🐴💨**
