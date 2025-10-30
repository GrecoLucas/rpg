/**
 * Arquivo principal da aplicação RPG
 * Orquestra a inicialização de todos os módulos
 */

// UI Modules
import { initTabs } from './ui/tabs.js';
import { initDiceUI } from './ui/dice-ui.js';
import { initLogUI } from './ui/log-ui.js';
import { renderScenario, initAssetsSlideshow } from './ui/scenario-ui.js';
import { loadAndRenderStory } from './ui/story-ui.js';
import { initCharactersUI } from './ui/characters-ui.js';
import { initEnemiesUI } from './ui/enemies-ui.js';
import { initBattleUI, initEnemyAttackPanel } from './ui/battle-ui.js';

/**
 * Inicializa toda a aplicação
 */
async function initApp() {
  // Sistema sempre em modo GM - remove seletor de modo
  removeModeSelector();
  
  // Inicializa interface
  initTabs();
  initDiceUI();
  initLogUI();
  
  // Cenários e história
  renderScenario();
  await initAssetsSlideshow();
  await loadAndRenderStory();
  
  // Personagens e inimigos
  initCharactersUI();
  initEnemiesUI();
  
  // Sistema de combate
  initBattleUI();
  initEnemyAttackPanel();
  
  console.log('✅ RPG App inicializado com sucesso!');
}

/**
 * Remove o seletor de modo (sempre GM)
 */
function removeModeSelector() {
  const modeSwitch = document.querySelector('.mode-switch');
  if (modeSwitch) {
    modeSwitch.remove();
  }
  
  // Define modo GM permanentemente
  document.body.dataset.mode = 'gm';
  
  // Remove classe gm-only de elementos (tudo é visível em modo GM)
  const gmOnlyElements = document.querySelectorAll('.gm-only');
  gmOnlyElements.forEach(el => el.classList.remove('gm-only'));
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);
