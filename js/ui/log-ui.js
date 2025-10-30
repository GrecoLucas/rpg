/**
 * Interface de visualização de logs
 */
import { $, formatTimestamp } from '../core/utils.js';
import { logManager } from '../managers/log-manager.js';

/**
 * Renderiza a lista de logs
 */
export function renderLog() {
  const list = logManager.getAll();
  const ul = $('#logList');
  
  if (!ul) return;
  
  ul.innerHTML = '';
  // Show only the last 5 entries, newest first
  const recent = list.length > 5 ? list.slice(-5).reverse() : list.slice().reverse();
  for (const e of recent) {
    const li = document.createElement('li');
    
    if (e.type === 'dice') {
      const rolls = e.rolls && Array.isArray(e.rolls) ? e.rolls.join(', ') : e.total;
      li.textContent = `[${formatTimestamp(e.ts)}] ${e.by === 'gm' ? 'GM' : 'Jogador'} rolou ${e.times}d${e.sides}: ${rolls} = ${e.total}`;
    } else if (e.type === 'scenario') {
      li.textContent = `[${formatTimestamp(e.ts)}] ${e.text}`;
    } else {
      li.textContent = `[${formatTimestamp(e.ts)}] ${e.text || 'Evento'}`;
    }
    
    ul.appendChild(li);
  }
}

/**
 * Inicializa os listeners de logs
 */
export function initLogUI() {
  // Listener para atualização de logs
  document.addEventListener('logsUpdated', renderLog);
  document.addEventListener('logAdded', renderLog);
  
  // Renderização inicial
  renderLog();
}
