# Guide d'Utilisation - Interface Vue Rapports de Paris

## Vue d'ensemble

Le composant `BettingReport.vue` affiche une interface complète pour visualiser les rapports de paris quotidiens avec:
- Statistiques de performance
- Paris quotidiens (probabilité > 40%)
- Top 20 Value Bets
- Combinaisons générées
- Résultats des courses

## Accès au Rapport

1. Lancez votre application Vue: `npm run dev`
2. Cliquez sur l'onglet **📊 Rapport Paris** dans la navigation
3. Sélectionnez une date avec le sélecteur de date
4. Le rapport se charge automatiquement

## Sections du Rapport

### 1. Cartes Résumé

**Carte "Paris du Jour":**
- Total de paris quotidiens stockés
- Nombre de value bets
- Nombre de combinaisons
- Courses avec résultats

**Carte "Performance":**
- Nombre de paris gagnants
- Total misé (en unités)
- Total des gains
- ROI (Return on Investment)
- Profit Net

La carte de performance change de couleur:
- 🟢 Vert: ROI > 10% (Excellent)
- 🔵 Bleu: ROI > 0% (Bon)
- 🔴 Rouge: ROI ≤ 0% (Mauvais)

### 2. Onglets

#### Onglet "Paris Quotidiens"
Affiche tous les paris avec probabilité > 40%:
- Nom du cheval
- Probabilité de victoire
- Cote offerte
- Statut (✓ GAGNÉ / ✗ PERDU / ⏳ En attente)
- Rapport si gagné

**Couleurs:**
- 🟢 Fond vert: Pari gagné
- 🔴 Fond rouge: Pari perdu
- ⚪ Fond blanc: En attente de résultats

#### Onglet "Value Bets"
Affiche les 20 meilleurs value bets classés:
- Classement (1-20)
- Nom du cheval
- Probabilité estimée
- Cote offerte
- **Value Score** (Kelly Criterion)
- Rapport si gagné

Les value bets sont triés par score décroissant.

#### Onglet "Combinaisons"
Affiche les combinaisons générées:
- Type (COUPLE, TRIO)
- Liste des chevaux
- Probabilité combinée
- Rapport si gagné

**Types de combinaisons:**
- **COUPLE**: 2 chevaux dans les 2 premiers
- **TRIO**: 3 chevaux dans les 3 premiers

#### Onglet "Résultats"
Affiche les résultats officiels PMU:
- Hippodrome et numéro de course
- Podium (1er, 2ème, 3ème)
- Rapports PMU pour tous les types de paris

**Podium avec couleurs:**
- 🥇 Or: 1er
- 🥈 Argent: 2ème
- 🥉 Bronze: 3ème

## Workflow Quotidien

### Jour J - Stockage des Paris

1. Le système génère des prédictions pour les courses
2. Via l'API, envoyez les prédictions:
```javascript
await pmuApi.processPredictions(today, predictions)
```

3. Automatiquement:
   - Paris > 40% stockés
   - Top 20 value bets stockés
   - Combinaisons générées

### Jour J+1 - Consultation des Résultats

1. Ouvrez l'interface "📊 Rapport Paris"
2. Sélectionnez la date d'hier
3. Consultez:
   - Performance globale
   - Détails par type de pari
   - Résultats officiels
4. Analysez le ROI et ajustez votre stratégie

## Fonctionnalités de l'Interface

### Sélection de Date
- Changez la date avec le sélecteur
- Cliquez sur "Actualiser" pour recharger
- Par défaut: rapport d'hier

### États d'Affichage

**Chargement:**
```
⏳ Génération du rapport...
```

**Erreur:**
```
! Erreur lors du chargement du rapport
[Bouton Réessayer]
```

**Succès:**
Affichage complet du rapport avec toutes les sections

### Navigation par Onglets
- Cliquez sur un onglet pour basculer
- Nombre d'éléments affiché entre parenthèses
- Ex: "Paris Quotidiens (45)"

## Interprétation des Métriques

### ROI (Return on Investment)
```
ROI = (Gains - Mises) / Mises × 100
```

**Exemples:**
- ROI = 25% → Pour 100€ misés, profit de 25€
- ROI = -10% → Pour 100€ misés, perte de 10€

### Value Score
```
Value Score = (Probabilité × Cote) - 1
```

**Interprétation:**
- Value > 0: Bon pari (cote sous-estimée)
- Value = 0: Pari équitable
- Value < 0: Mauvais pari (cote surestimée)

**Exemple:**
- Probabilité: 30% (0.30)
- Cote: 4.0
- Value = (0.30 × 4.0) - 1 = 0.20
- → Value bet positif de 20%

### Probabilité Combinée
Pour un COUPLE:
```
Prob Combinée = Prob_Cheval1 × Prob_Cheval2
```

**Exemple:**
- Cheval 1: 45%
- Cheval 2: 40%
- Combinée: 0.45 × 0.40 = 0.18 = 18%

## Personnalisation

### Modifier les Couleurs
Dans `BettingReport.vue`, section `<style>`:

```css
/* Performance excellente */
.performance-card.excellent {
  border-left: 4px solid #10b981; /* Vert */
}

/* Pari gagné */
.bet-card.won {
  border-left-color: #10b981;
  background: #f0fdf4;
}
```

### Modifier les Seuils
Dans le code du composant:

```javascript
const performanceClass = computed(() => {
  const roi = report.value.summary.roi
  if (roi > 10) return 'excellent'  // Changez 10
  if (roi > 0) return 'good'
  return 'poor'
})
```

## Conseils d'Utilisation

1. **Consultez quotidiennement**: Suivez l'évolution de votre ROI
2. **Analysez les tendances**: Identifiez les types de paris les plus rentables
3. **Ajustez les seuils**: Si trop/pas assez de paris, modifiez le seuil de 40%
4. **Vérifiez les value bets**: Les meilleurs scores donnent-ils vraiment de bons résultats?
5. **Étudiez les combinaisons**: COUPLE ou TRIO plus rentable?

## Dépannage

### Le rapport ne charge pas
- Vérifiez que le backend est lancé
- Vérifiez l'URL de l'API dans `pmuApi.js`
- Ouvrez la console développeur (F12) pour voir les erreurs

### Pas de données pour une date
- Les résultats ne sont disponibles que le lendemain
- Vérifiez que la commande `betting:fetch-results` a été exécutée
- Vérifiez qu'il y avait des paris pour cette date

### Performance toujours à 0%
- Pas encore de résultats pour cette date
- Les résultats PMU n'ont pas été récupérés
- Exécutez: `php artisan betting:fetch-results`

## API Utilisées

Le composant utilise ces endpoints:

```javascript
// Récupérer le rapport complet
GET /api/pmu/betting/generate-report?date=YYYY-MM-DD

// Récupérer les paris quotidiens uniquement
GET /api/pmu/betting/daily-bets?date=YYYY-MM-DD

// Récupérer les value bets uniquement
GET /api/pmu/betting/value-bets?date=YYYY-MM-DD

// Récupérer les combinaisons uniquement
GET /api/pmu/betting/combinations?date=YYYY-MM-DD
```

## Intégration avec d'autres Composants

Le composant est autonome mais peut être enrichi:

```vue
<!-- Ajouter un graphique de performance -->
<script setup>
import BettingChart from './BettingChart.vue'
// ...
</script>

<template>
  <!-- Après les cartes résumé -->
  <BettingChart :data="report.performance" />
</template>
```

## Export de Données

Pour exporter les données:

```javascript
// Dans BettingReport.vue
const exportToCSV = () => {
  const csv = generateCSV(report.value)
  downloadFile(csv, 'rapport-paris.csv')
}
```

Ajoutez un bouton d'export dans le header.
