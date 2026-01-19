STRUCTURE DU PROJET
===================

src/
├── App.vue                      → Point d'entrée, importe PMURaces
├── components/
│   └── PMURaces.vue            → Layout 4 zones (NOUVEAU)
├── composables/
│   └── usePMU.js               → Logique réutilisable
└── services/
    └── pmuApi.js               → Appels API (avec BASE_URL = '/api/pmu')

vite.config.js                   → Config proxy CORS


LAYOUT 4 ZONES
==============

┌──────────────────────────────────────────────────┐
│  Header: Charger le programme                    │
├──────────┬────────────┬──────────────────────────┤
│          │            │                          │
│ GAUCHE   │  MILIEU    │  DROITE HAUT             │
│ Réunions │  Courses   │  Liste chevaux           │
│          │            │                          │
│  R1      │   C1       │  1. MADAME LY            │
│  R2      │   C2       │  2. AUTRE CHEVAL         │
│  R3      │   C3       │  3. ...                  │
│          │            │                          │
│          │            ├──────────────────────────┤
│          │            │  DROITE BAS              │
│          │            │  Détails cheval cliqué   │
│          │            │                          │
│          │            │  Toutes les propriétés   │
│          │            │  en JSON                 │
└──────────┴────────────┴──────────────────────────┘


UTILISATION
===========

1. Assure-toi que vite.config.js a le proxy configuré
2. Assure-toi que pmuApi.js utilise BASE_URL = '/api/pmu'
3. npm run dev


DONNÉES AFFICHÉES
=================

Dans "Détails" (droite bas), TOUTES les propriétés du cheval sont affichées:
- idCheval
- nom
- numPmu
- age, sexe, race
- driver (jockey)
- entraineur
- musique
- nombreCourses, nombreVictoires, nombrePlaces
- gainsParticipant (carrière, année)
- dernierRapportDirect (cote)
- handicapValeur, handicapPoids
- nomPere, nomMere
- urlCasaque
- ... et tout le reste

Parfait pour analyser et construire ton backend !