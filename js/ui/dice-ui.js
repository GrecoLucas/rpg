/**
 * Interface de rolagem de dados
 */
import { $, clamp } from '../core/utils.js';
import { rollDice } from '../core/dice.js';
import { logManager } from '../managers/log-manager.js';

/**
 * Inicializa a interface de dados
 */
export function initDiceUI() {
  const diceType = $('#diceType');
  const diceTimes = $('#diceTimes');
  const rollBtn = $('#rollBtn');
  const clearBtn = $('#clearLogBtn');
  const resultDisplay = $('#diceResult');

  rollBtn.addEventListener('click', () => {
    const sides = Number(diceType.value);
    const times = clamp(Number(diceTimes.value), 1, 20);
    const res = rollDice(sides, times);
    
    // Mostra o resultado na tela
    if (times === 1) {
      resultDisplay.textContent = `Resultado: ${res.total}`;
    } else {
      resultDisplay.textContent = `Resultados: ${res.rolls.join(', ')} = ${res.total}`;
    }
    
    logManager.add({ type: 'dice', by: 'gm', ...res });
  });

  clearBtn.addEventListener('click', () => {
    logManager.clear();
    // Trigger render através de evento customizado
    document.dispatchEvent(new CustomEvent('logsUpdated'));
  });
}
