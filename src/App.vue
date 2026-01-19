<script setup>
  import { ref } from 'vue'
  import PMURaces from './components/PMURaces.vue'
  import TopHorses from './components/TopHorses.vue'

  const currentView = ref('races') // 'races' ou 'top'
  </script>

  <template>
    <div id="app">
      <!-- Navigation simple -->
      <nav>
        <button
          :class="{ active: currentView === 'races' }"
          @click="currentView = 'races'"
        >
          📅 Programme
        </button>
        <button
          :class="{ active: currentView === 'top' }"
          @click="currentView = 'top'"
        >
          🏆 Top Chevaux
        </button>
      </nav>

      <!-- Affichage conditionnel -->
      <PMURaces v-if="currentView === 'races'" />
      <TopHorses v-else-if="currentView === 'top'" />
    </div>
  </template>

  <style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    min-height: 100vh;
    background: #f5f5f5;
  }

  nav {
    background: #2196F3;
    padding: 0;
    display: flex;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  nav button {
    flex: 1;
    padding: 16px;
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
    border-bottom: 3px solid transparent;
  }

  nav button:hover {
    background: rgba(255,255,255,0.1);
  }

  nav button.active {
    background: rgba(255,255,255,0.2);
    border-bottom-color: white;
  }
  </style>