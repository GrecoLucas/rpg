/**
 * Gerenciamento de abas da interface
 */
import { $all } from '../core/utils.js';

/**
 * Ativa uma aba específica
 */
export function activateTab(tab) {
  $all('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
    b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });
  $all('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
}

/**
 * Inicializa o sistema de abas
 */
export function initTabs() {
  $all('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
}
