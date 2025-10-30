/**
 * Interface da mesa - personagens, inimigos e combate
 */
import { $, $all } from '../core/utils.js';
import { characters, getClassByKey, applyClassMods, getClassAbilities, calculateAbilitySuccess } from '../core/characters.js';
import { enemies, performEnemyAttack } from '../core/enemies.js';
import { battle } from '../core/battle.js';
import { logManager } from '../managers/log-manager.js';

/**
 * Renderiza os personagens na mesa
 */
export function renderMesaCharacters() {
  const container = $('#charactersList');
  if (!container) return;
  
  const list = characters.getAll();
  
  if (list.length === 0) {
    container.innerHTML = '<p class="muted">Nenhum personagem criado ainda. Vá para a aba Personagens para criar.</p>';
    return;
  }
  
  const battleState = battle.getState();
  const currentTurnCharId = battle.getCurrentCharId();
  
  container.innerHTML = list.map(char => {
    const cls = getClassByKey(char.classKey);
    const hpPercent = (char.currentHP / char.maxHP) * 100;
    const isCurrentTurn = battleState.active && currentTurnCharId === char.id;
    
    return `
      <div class="character-card ${isCurrentTurn ? 'current-turn' : ''}" data-char-id="${char.id}">
        <div class="char-header">
          <h3>${char.name}</h3>
          <span class="small">${cls?.nome || char.classKey}</span>
        </div>
        <div class="hp-bar">
          <div class="hp-label">HP: ${char.currentHP} / ${char.maxHP}</div>
          <div class="hp-bar-bg">
            <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
          </div>
        </div>
        <div class="char-actions">
          <button class="small-btn view-abilities-btn" data-char-id="${char.id}">Ver Habilidades</button>
          <button class="small-btn apply-damage-btn" data-char-id="${char.id}">Aplicar Dano</button>
          <button class="small-btn reset-hp-btn" data-char-id="${char.id}">Resetar HP</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners para os botões
  $all('.view-abilities-btn').forEach(btn => {
    btn.addEventListener('click', () => showAbilities(btn.dataset.charId));
  });

  // Botão para aplicar dano manualmente
  $all('.apply-damage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const charId = btn.dataset.charId;
      const char = characters.getById(charId);
      if (!char) return;

      const input = prompt(`Aplicar quanto de dano a ${char.name}? (insira um número positivo)`, '1');
      if (input === null) return;
      const amt = Math.max(0, Math.floor(Number(input) || 0));
      if (amt <= 0) return alert('Valor inválido. Insira um número maior que 0.');

      const reason = prompt('Motivo do dano (ex: armadilha, queda, fogo):', 'Ambiente') || 'Ambiente';

      characters.damage(charId, amt);
      logManager.add({ type: 'damage', text: `${char.name} recebeu ${amt} de dano (${reason}).` });
      
      document.dispatchEvent(new CustomEvent('logAdded'));
      document.dispatchEvent(new CustomEvent('charactersUpdated'));
      document.dispatchEvent(new CustomEvent('enemiesUpdated'));
    });
  });

  $all('.reset-hp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const charId = btn.dataset.charId;
      const char = characters.getById(charId);
      characters.resetHP(charId);
      renderMesaCharacters();
      logManager.add({ type: 'heal', text: `HP de ${char?.name} foi restaurado.` });
      document.dispatchEvent(new CustomEvent('logAdded'));
    });
  });
}

/**
 * Renderiza os inimigos na mesa
 */
export function renderEnemiesInBattle() {
  const container = $('#enemiesInBattle');
  if (!container) return;
  
  const list = enemies.getInBattle();
  
  if (list.length === 0) {
    container.innerHTML = '<p class="muted small">Nenhum inimigo ativo. Vá para a aba Mestre e marque os inimigos para aparecerem aqui.</p>';
    return;
  }
  
  const isGMTurn = battle.isGMTurn();
  
  container.innerHTML = list.map(enemy => {
    const hpPercent = (enemy.currentHP / enemy.maxHP) * 100;
    const isAlive = enemy.currentHP > 0;
    
    return `
      <div class="enemy-card ${isGMTurn ? 'gm-turn' : ''} ${!isAlive ? 'dead' : ''}" data-enemy-id="${enemy.id}">
        <div class="enemy-header">
          <h4>${enemy.name}</h4>
          ${!isAlive ? '<span class="dead-badge">MORTO</span>' : ''}
        </div>
        <div class="hp-bar">
          <div class="hp-label">HP: ${enemy.currentHP} / ${enemy.maxHP}</div>
          <div class="hp-bar-bg">
            <div class="hp-bar-fill" style="width: ${hpPercent}%"></div>
          </div>
        </div>
        <div class="enemy-actions">
          <button class="small-btn view-enemy-attacks-btn" data-enemy-id="${enemy.id}" ${!isAlive ? 'disabled' : ''}>
            Atacar
          </button>
          <button class="small-btn reset-enemy-hp-btn" data-enemy-id="${enemy.id}">
            Resetar HP
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners
  $all('.view-enemy-attacks-btn').forEach(btn => {
    btn.addEventListener('click', () => showEnemyAttacks(btn.dataset.enemyId));
  });
  
  $all('.reset-enemy-hp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const enemy = enemies.getById(btn.dataset.enemyId);
      enemies.resetHP(btn.dataset.enemyId);
      renderEnemiesInBattle();
      logManager.add({ type: 'heal', text: `HP de ${enemy?.name} foi restaurado.` });
      document.dispatchEvent(new CustomEvent('logAdded'));
    });
  });
}

/**
 * Mostra o painel de habilidades de um personagem
 */
function showAbilities(charId) {
  const char = characters.getById(charId);
  if (!char) return;
  
  const panel = $('#abilityPanel');
  if (!panel) return;
  
  // Se já está mostrando este personagem, fecha
  if (panel.style.display === 'block' && panel.dataset.currentCharId === charId) {
    panel.style.display = 'none';
    panel.dataset.currentCharId = '';
    return;
  }
  
  const nameSpan = $('#selectedCharName');
  const abilitiesList = $('#abilitiesList');
  
  if (nameSpan) nameSpan.textContent = char.name;
  panel.dataset.currentCharId = charId;
  
  const abilities = getClassAbilities(char.classKey);
  const finalAttrs = applyClassMods(char.attrs, char.classKey);
  
  // Lista de alvos possíveis
  const enemyTargets = enemies.getAll().filter(e => e.currentHP > 0);
  const playerTargets = characters.getAll().filter(c => c.currentHP > 0);
  
  if (abilitiesList) {
    abilitiesList.innerHTML = abilities.map(ability => {
      const attrValue = finalAttrs[ability.atributo] || 0;
      const modifier = Math.floor(attrValue / 5);
      
      // Define alvos baseado no tipo de habilidade
      let targetOptions = '';
      if (ability.tipo === 'ataque') {
        targetOptions = enemyTargets.map(e => `<option value="enemy-${e.id}">${e.name} (HP: ${e.currentHP})</option>`).join('');
      } else if (ability.tipo === 'defesa' || ability.tipo === 'suporte') {
        if (ability.curaTodos) {
          targetOptions = '<option value="all-players">Todos os Aliados</option>';
        } else {
          targetOptions = playerTargets.map(c => `<option value="player-${c.id}">${c.name} (HP: ${c.currentHP})</option>`).join('');
        }
      }
      
      return `
        <div class="ability-card">
          <h4>${ability.nome}</h4>
          <p class="small">${ability.descricao}</p>
          <div class="ability-stats small">
            <span>Atributo: ${ability.atributo} (${attrValue}, +${modifier})</span>
            <span>Dificuldade: ${ability.dificuldade}</span>
          </div>
          ${targetOptions ? `
            <div class="target-selection">
              <label class="small">Alvo:</label>
              <select class="target-select" data-ability-key="${ability.key}">
                ${targetOptions}
              </select>
            </div>
          ` : ''}
          <button class="use-ability-btn" data-char-id="${charId}" data-ability-key="${ability.key}">
            Usar Habilidade
          </button>
        </div>
      `;
    }).join('');
    
    // Adiciona botão de fechar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Fechar';
    closeBtn.className = 'secondary';
    closeBtn.style.marginTop = '0.5rem';
    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
      panel.dataset.currentCharId = '';
    });
    abilitiesList.appendChild(closeBtn);
  }
  
  panel.style.display = 'block';
  
  // Event listeners para usar habilidades
  $all('.use-ability-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const abilityKey = btn.dataset.abilityKey;
      const targetSelect = document.querySelector(`.target-select[data-ability-key="${abilityKey}"]`);
      const targetValue = targetSelect?.value || null;
      useAbility(btn.dataset.charId, abilityKey, targetValue);
    });
  });
}

/**
 * Usa uma habilidade
 */
function useAbility(charId, abilityKey, targetValue) {
  const result = calculateAbilitySuccess(charId, abilityKey);
  
  if (!result.success && !result.ability) {
    alert(result.message);
    return;
  }
  
  const ability = result.ability;
  const char = result.char;
  
  // Valida se tem alvo quando necessário
  if (ability.tipo === 'ataque' && !targetValue) {
    alert('Selecione um alvo para atacar!');
    return;
  }
  
  let logText = `${char.name} usou ${ability.nome}! Rolou ${result.roll} + ${result.modifier} = ${result.total} (dificuldade ${result.difficulty})`;
  
  if (result.success) {
    logText += ' - SUCESSO!';
    
    // Aplica efeitos da habilidade
    if (ability.tipo === 'ataque' && ability.dano) {
      if (targetValue && targetValue.startsWith('enemy-')) {
        const enemyId = targetValue.replace('enemy-', '');
        enemies.damage(enemyId, ability.dano);
        const enemy = enemies.getById(enemyId);
        logText += ` Causou ${ability.dano} de dano em ${enemy?.name}.`;
      }
    } else if (ability.tipo === 'defesa' && ability.cura) {
      if (targetValue && targetValue.startsWith('player-')) {
        const playerId = targetValue.replace('player-', '');
        characters.heal(playerId, ability.cura);
        const player = characters.getById(playerId);
        logText += ` ${player?.name} recuperou ${ability.cura} HP.`;
      } else {
        characters.heal(charId, ability.cura);
        logText += ` Recuperou ${ability.cura} HP.`;
      }
    } else if (ability.tipo === 'suporte' && ability.curaTodos) {
      const allChars = characters.getAll();
      allChars.forEach(c => characters.heal(c.id, ability.cura));
      logText += ` Todos recuperaram ${ability.cura} HP.`;
    }
  } else {
    logText += ' - FALHOU!';
  }
  
  logManager.add({ type: 'ability', text: logText });
  
  document.dispatchEvent(new CustomEvent('logAdded'));
  document.dispatchEvent(new CustomEvent('charactersUpdated'));
  document.dispatchEvent(new CustomEvent('enemiesUpdated'));
}

/**
 * Mostra os ataques de um inimigo
 */
function showEnemyAttacks(enemyId) {
  const enemy = enemies.getById(enemyId);
  if (!enemy) return;
  
  const panel = $('#enemyAttackPanel');
  const nameSpan = $('#selectedEnemyName');
  const hpSpan = $('#selectedEnemyHP');
  const attacksList = $('#enemyAttacksList');
  
  if (!panel || !nameSpan || !hpSpan || !attacksList) return;
  
  nameSpan.textContent = enemy.name;
  hpSpan.textContent = `${enemy.currentHP} / ${enemy.maxHP}`;
  
  const playerChars = characters.getAll().filter(c => c.currentHP > 0);
  
  attacksList.innerHTML = enemy.attacks.map((attack, index) => `
    <div class="enemy-attack-card" data-attack-index="${index}">
      <h4>${attack.name}</h4>
      <div class="attack-stats small">
        <span>Dano: ${attack.damage}</span>
        <span>Chance: ${attack.successChance}/20</span>
      </div>
      <div class="target-selection">
        <label class="small">Alvo:</label>
        <select class="target-select-enemy">
          ${playerChars.map(c => `<option value="${c.id}">${c.name} (HP: ${c.currentHP})</option>`).join('')}
        </select>
      </div>
      <button class="use-enemy-attack-btn" data-enemy-id="${enemyId}" data-attack-index="${index}">
        Executar Ataque
      </button>
    </div>
  `).join('');
  
  panel.style.display = 'block';
  
  // Event listeners
  $all('.use-enemy-attack-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const attackIndex = Number(btn.dataset.attackIndex);
      const enemyIdFromBtn = btn.dataset.enemyId;
      
      const card = btn.closest('.enemy-attack-card');
      const targetSelect = card.querySelector('.target-select-enemy');
      const targetId = targetSelect?.value;
      
      if (!targetId) {
        alert('Selecione um alvo!');
        return;
      }
      
      performAttack(enemyIdFromBtn, attackIndex, targetId);
    });
  });
}

/**
 * Executa um ataque de inimigo
 */
function performAttack(enemyId, attackIndex, targetCharId) {
  const result = performEnemyAttack(enemyId, attackIndex, targetCharId);
  
  if (!result.success && !result.attack) {
    alert(result.message);
    return;
  }
  
  const attack = result.attack;
  const enemy = result.enemy;
  const target = characters.getById(targetCharId);
  
  let logText = `${enemy.name} usou ${attack.name} contra ${target.name}! Rolou ${result.roll} (chance: ${result.successChance}/20)`;
  
  if (result.success) {
    logText += ` - ACERTOU! Causou ${result.damage} de dano.`;
    characters.damage(targetCharId, result.damage);
  } else {
    logText += ` - ERROU!`;
  }
  
  logManager.add({ type: 'enemy-attack', text: logText });
  
  document.dispatchEvent(new CustomEvent('logAdded'));
  document.dispatchEvent(new CustomEvent('charactersUpdated'));
  document.dispatchEvent(new CustomEvent('enemiesUpdated'));
  
  // Atualiza o painel de ataques
  showEnemyAttacks(enemyId);
}

/**
 * Inicializa o painel de inimigos
 */
export function initEnemyAttackPanel() {
  const closeBtn = $('#closeEnemyPanelBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const panel = $('#enemyAttackPanel');
      if (panel) panel.style.display = 'none';
    });
  }
}

/**
 * Atualiza a UI de combate
 */
export function updateBattleUI() {
  const isActive = battle.isActive();
  const startBtn = $('#startBattleBtn');
  const endBtn = $('#endBattleBtn');
  const turnIndicator = $('#turnIndicator');
  const currentTurnPlayer = $('#currentTurnPlayer');
  
  if (startBtn) startBtn.style.display = isActive ? 'none' : '';
  if (endBtn) endBtn.style.display = isActive ? '' : 'none';
  if (turnIndicator) turnIndicator.style.display = isActive ? '' : 'none';
  
  if (isActive && currentTurnPlayer) {
    const currentTurn = battle.getCurrentTurn();
    if (currentTurn?.type === 'gm') {
      currentTurnPlayer.textContent = 'Mestre (GM)';
      currentTurnPlayer.style.fontWeight = 'bold';
      currentTurnPlayer.style.color = '#dc2626';
    } else {
      const currentCharId = battle.getCurrentCharId();
      const currentChar = characters.getById(currentCharId);
      currentTurnPlayer.textContent = currentChar?.name || '-';
      currentTurnPlayer.style.fontWeight = 'bold';
      currentTurnPlayer.style.color = '#2563eb';
    }
  }
  
  renderMesaCharacters();
  renderEnemiesInBattle();
}

/**
 * Inicializa o sistema de combate
 */
export function initBattleUI() {
  const startBtn = $('#startBattleBtn');
  const endBtn = $('#endBattleBtn');
  const nextBtn = $('#nextTurnBtn');
  
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const allChars = characters.getAll();
      if (allChars.length === 0) {
        alert('Crie personagens primeiro na aba Personagens!');
        return;
      }
      
      battle.start(allChars.map(c => c.id));
      const currentTurn = battle.getCurrentTurn();
      const turnName = currentTurn?.type === 'gm' ? 'Mestre (GM)' : characters.getById(currentTurn?.id)?.name;
      logManager.add({ type: 'battle', text: `Combate iniciado! Turno de ${turnName}` });
      document.dispatchEvent(new CustomEvent('logAdded'));
      updateBattleUI();
    });
  }
  
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      if (!confirm('Encerrar o combate?')) return;
      battle.end();
      logManager.add({ type: 'battle', text: 'Combate encerrado.' });
      document.dispatchEvent(new CustomEvent('logAdded'));
      updateBattleUI();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      battle.nextTurn();
      const currentTurn = battle.getCurrentTurn();
      const turnName = currentTurn?.type === 'gm' ? 'Mestre (GM)' : characters.getById(currentTurn?.id)?.name;
      logManager.add({ type: 'turn', text: `Turno de ${turnName}` });
      document.dispatchEvent(new CustomEvent('logAdded'));
      updateBattleUI();
    });
  }
  
  // Listeners para atualizações
  document.addEventListener('charactersUpdated', () => {
    renderMesaCharacters();
  });
  
  document.addEventListener('enemiesUpdated', () => {
    renderEnemiesInBattle();
  });
  
  updateBattleUI();
}
