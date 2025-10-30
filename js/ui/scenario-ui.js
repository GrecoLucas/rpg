/**
 * Interface de gerenciamento de cenários
 */
import { $ } from '../core/utils.js';
import { scenarioManager } from '../managers/scenario-manager.js';
import { logManager } from '../managers/log-manager.js';

/**
 * Renderiza a imagem do cenário atual
 */
export function renderScenario() {
  const img = $('#scenarioImage');
  if (!img) return;
  
  const saved = scenarioManager.getCurrent();
  img.src = saved;
}

/**
 * Inicializa o slideshow de assets
 */
export async function initAssetsSlideshow() {
  const selectEl = $('#coverSelect');
  const setCoverBtn = $('#setCoverBtn');
  
  if (!selectEl || !setCoverBtn) return;
  
  const assets = await scenarioManager.loadAvailableAssets();
  
  if (assets.length === 0) {
    setCoverBtn.disabled = true;
    return;
  }
  
  // Popula o dropdown
  selectEl.innerHTML = assets.map((img) => 
    `<option value="${img.path}">${img.name}</option>`
  ).join('');
  
  setCoverBtn.disabled = false;
  
  // Event listener para definir capa
  setCoverBtn.addEventListener('click', () => {
    const selectedPath = selectEl.value;
    if (!selectedPath) return;
    
    scenarioManager.setCurrent(selectedPath);
    renderScenario();
    logManager.add({ type: 'scenario', text: 'Capa atualizada pelo GM.' });
    document.dispatchEvent(new CustomEvent('logAdded'));
  });
}
