import { storage } from './storage.js';
import { rollDice } from './dice.js';
import { classesData, characters, clampDistribution, totalPoints, applyClassMods, getClassByKey, getClassAbilities, calculateAbilitySuccess } from './characters.js';
import { battle, gmMessages } from './battle.js';
import { enemies, performEnemyAttack } from './enemies.js';

const MODE_KEY = 'mode';
const SCENARIO_KEY = 'scenarioImage';
const NOTES_KEY = 'secretNotes';
const LOG_KEY = 'log';

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function setMode(mode) {
  document.body.dataset.mode = mode;
  storage.set(MODE_KEY, mode);
  // Ajusta visibilidade de abas
  const gmTabBtn = document.querySelector('[data-tab="mestre"]');
  if (gmTabBtn) gmTabBtn.style.display = (mode === 'gm') ? '' : 'none';
  // Se a aba ativa é mestre e mudou pra player, volta para mesa
  const active = document.querySelector('.tab-btn.active');
  if (mode === 'player' && active && active.dataset.tab === 'mestre') {
    activateTab('mesa');
  }
}

function activateTab(tab) {
  $all('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
    b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  });
  $all('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
}

function initTabs() {
  $all('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
}

function initModeSwitch() {
  const modeSel = $('#modeSelect');
  const saved = storage.get(MODE_KEY, 'gm');
  modeSel.value = saved;
  setMode(saved);
  modeSel.addEventListener('change', () => setMode(modeSel.value));
}

function renderScenario() {
  const img = $('#scenarioImage');
  const saved = storage.get(SCENARIO_KEY, null);
  if (saved) {
    img.src = saved;
  } else {
    img.src = 'assets/placeholder.svg'; // Usa placeholder SVG
  }
}

async function initAssetsSlideshow() {
  const selectEl = $('#coverSelect');
  const setCoverBtn = $('#setCoverBtn');
  
  if (!selectEl || !setCoverBtn) return;
  
  try {
    const response = await fetch('assets/manifest.json');
    const data = await response.json();
    const assets = data.images || [];
    
    if (assets.length === 0) {
      setCoverBtn.disabled = true;
      return;
    }
    
    // Popula o dropdown
    selectEl.innerHTML = assets.map((img, idx) => 
      `<option value="${img.path}">${img.name}</option>`
    ).join('');
    
    setCoverBtn.disabled = false;
  } catch (error) {
    console.error('Erro ao carregar manifest:', error);
    setCoverBtn.disabled = true;
  }
  
  // Event listener para definir capa
  setCoverBtn?.addEventListener('click', () => {
    const selectedPath = selectEl.value;
    if (!selectedPath) return;
    
    storage.set(SCENARIO_KEY, selectedPath);
    renderScenario();
    addLog({ type: 'scenario', text: 'Capa atualizada pelo GM.' });
  });
}

let attackCounter = 0;

function initEnemies() {
  const form = $('#enemyForm');
  const deleteBtn = $('#deleteEnemyBtn');
  const addAttackBtn = $('#addAttackBtn');
  const resetBtn = $('#resetEnemyFormBtn');
  
  // Adiciona primeiro ataque por padrão
  addAttackField();
  
  addAttackBtn.addEventListener('click', addAttackField);
  
  resetBtn.addEventListener('click', () => {
    form.reset();
    $('#attacksList').innerHTML = '';
    attackCounter = 0;
    addAttackField();
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#enemyName').value.trim();
    const maxHP = $('#enemyHP').value;
    
    if (!name) return alert('Informe o nome do inimigo.');
    
    // Coleta ataques
    const attacks = [];
    $all('.attack-field').forEach(field => {
      const attackName = field.querySelector('.attack-name').value.trim();
      const damage = field.querySelector('.attack-damage').value;
      const successChance = field.querySelector('.attack-success').value;
      
      if (attackName) {
        attacks.push({
          name: attackName,
          damage: Number(damage) || 0,
          successChance: Number(successChance) || 10
        });
      }
    });
    
    const enemy = enemies.create({ name, maxHP, attacks });
    enemies.save(enemy);
    enemies.setSelectedId(enemy.id);
    
    form.reset();
    $('#attacksList').innerHTML = '';
    attackCounter = 0;
    addAttackField();
    
    renderEnemies();
    renderEnemiesInBattle();
  });
  
  deleteBtn.addEventListener('click', () => {
    const id = enemies.getSelectedId();
    if (!id) return;
    if (!confirm('Excluir inimigo selecionado?')) return;
    enemies.delete(id);
    renderEnemies();
    renderEnemiesInBattle();
  });
  
  renderEnemies();
}

function addAttackField() {
  const container = $('#attacksList');
  const attackId = attackCounter++;
  
  const div = document.createElement('div');
  div.className = 'attack-field';
  div.innerHTML = `
    <div class="attack-field-grid">
      <input type="text" class="attack-name" placeholder="Nome do ataque" required />
      <input type="number" class="attack-damage" placeholder="Dano" min="0" max="100" value="10" />
      <input type="number" class="attack-success" placeholder="Chance (1-20)" min="1" max="20" value="10" />
      <button type="button" class="danger remove-attack-btn">×</button>
    </div>
  `;
  
  container.appendChild(div);
  
  div.querySelector('.remove-attack-btn').addEventListener('click', () => {
    if ($all('.attack-field').length > 1) {
      div.remove();
    } else {
      alert('Deve haver pelo menos um ataque.');
    }
  });
}

function renderEnemies() {
  const list = enemies.getAll();
  const ul = $('#enemiesList');
  const selectedId = enemies.getSelectedId();
  
  ul.innerHTML = '';
  
  for (const enemy of list) {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '0.5rem';
    
    // Checkbox para ativar na mesa
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enemy.inBattle || false;
    checkbox.title = 'Ativar na Mesa';
    checkbox.addEventListener('change', () => {
      enemies.toggleInBattle(enemy.id);
      renderEnemiesInBattle();
    });
    
    const info = document.createElement('div');
    info.innerHTML = `<strong>${enemy.name}</strong><div class="small">HP: ${enemy.currentHP}/${enemy.maxHP} | Ataques: ${enemy.attacks.length}</div>`;
    
    left.appendChild(checkbox);
    left.appendChild(info);
    
    const right = document.createElement('div');
    const btn = document.createElement('button');
    btn.textContent = 'Selecionar';
    btn.className = 'small-btn';
    btn.addEventListener('click', () => {
      enemies.setSelectedId(enemy.id);
      renderEnemies();
    });
    right.appendChild(btn);
    li.appendChild(left);
    li.appendChild(right);
    if (enemy.id === selectedId) li.style.background = '#fef3c7';
    ul.appendChild(li);
  }
  
  $('#deleteEnemyBtn').disabled = !selectedId;
}

function renderEnemiesInBattle() {
  const container = $('#enemiesInBattle');
  const list = enemies.getInBattle(); // Apenas inimigos ativos
  
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
          <button class="small-btn gm-only reset-enemy-hp-btn" data-enemy-id="${enemy.id}">
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
      enemies.resetHP(btn.dataset.enemyId);
      renderEnemiesInBattle();
      addLog({ type: 'heal', text: `HP de ${enemies.getById(btn.dataset.enemyId)?.name} foi restaurado.` });
    });
  });
}

function showEnemyAttacks(enemyId) {
  const enemy = enemies.getById(enemyId);
  if (!enemy) return;
  
  const panel = $('#enemyAttackPanel');
  const nameSpan = $('#selectedEnemyName');
  const hpSpan = $('#selectedEnemyHP');
  const attacksList = $('#enemyAttacksList');
  
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
      
      // Busca o card pai e então o select dentro dele
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
  
  addLog({ type: 'enemy-attack', text: logText });
  renderEnemiesInBattle();
  renderMesaCharacters();
  renderCharacters();
  
  // Atualiza o painel de ataques
  showEnemyAttacks(enemyId);
}

$('#closeEnemyPanelBtn')?.addEventListener('click', () => {
  $('#enemyAttackPanel').style.display = 'none';
});

function addLog(entry) {
  const list = storage.get(LOG_KEY, []);
  list.unshift({ id: Date.now(), ts: new Date().toISOString(), ...entry });
  storage.set(LOG_KEY, list.slice(0, 10)); // mantém últimos 10
  renderLog();
}

function renderLog() {
  const list = storage.get(LOG_KEY, []);
  const ul = $('#logList');
  ul.innerHTML = '';
  for (const e of list) {
    const li = document.createElement('li');
    if (e.type === 'dice') {
      const rolls = e.rolls && Array.isArray(e.rolls) ? e.rolls.join(', ') : e.total;
      li.textContent = `[${new Date(e.ts).toLocaleTimeString()}] ${e.by === 'gm' ? 'GM' : 'Jogador'} rolou ${e.times}d${e.sides}: ${rolls} = ${e.total}`;
    } else if (e.type === 'scenario') {
      li.textContent = `[${new Date(e.ts).toLocaleTimeString()}] ${e.text}`;
    } else {
      li.textContent = `[${new Date(e.ts).toLocaleTimeString()}] ${e.text || 'Evento'}`;
    }
    ul.appendChild(li);
  }
}

function initDice() {
  const diceType = $('#diceType');
  const diceTimes = $('#diceTimes');
  const rollBtn = $('#rollBtn');
  const clearBtn = $('#clearLogBtn');
  const resultDisplay = $('#diceResult');

  rollBtn.addEventListener('click', () => {
    const sides = Number(diceType.value);
    const times = Math.max(1, Math.min(20, Number(diceTimes.value)));
    const res = rollDice(sides, times);
    const mode = storage.get(MODE_KEY, 'gm');
    
    // Mostra o resultado na tela
    if (times === 1) {
      resultDisplay.textContent = `Resultado: ${res.total}`;
    } else {
      resultDisplay.textContent = `Resultados: ${res.rolls.join(', ')} = ${res.total}`;
    }
    
    addLog({ type: 'dice', by: mode, ...res });
  });

  clearBtn.addEventListener('click', () => {
    storage.remove(LOG_KEY);
    renderLog();
  });
}

function fillClassSelect() {
  const sel = $('#charClass');
  sel.innerHTML = '';
  for (const cls of classesData) {
    const opt = document.createElement('option');
    opt.value = cls.key; opt.textContent = `${cls.nome}`;
    sel.appendChild(opt);
  }
  
  // Adiciona listener para mostrar habilidades ao mudar classe
  sel.addEventListener('change', () => {
    showClassAbilitiesPreview(sel.value);
  });
  
  // Mostra habilidades da primeira classe por padrão
  showClassAbilitiesPreview(sel.value);
}

function showClassAbilitiesPreview(classKey) {
  const existingPreview = $('#classAbilitiesPreview');
  
  if (existingPreview) {
    existingPreview.remove();
  }
  
  const cls = getClassByKey(classKey);
  if (!cls) return;
  
  const container = document.createElement('div');
  container.id = 'classAbilitiesPreview';
  container.className = 'class-abilities-preview';
  container.innerHTML = `
    <h4>Habilidades desta Classe:</h4>
    <div class="abilities-list-preview">
      ${cls.habilidades.map(ability => `
        <div class="ability-preview-item">
          <strong>${ability.nome}</strong>
          <p class="small">${ability.descricao}</p>
          <div class="small muted">Atributo: ${ability.atributo} | Dificuldade: ${ability.dificuldade}</div>
        </div>
      `).join('')}
    </div>
  `;
  
  // Insere após a grid de atributos
  const attributesDiv = document.querySelector('.attributes');
  attributesDiv.appendChild(container);
}

function readAttrsFromForm() {
  const inputs = $all('.attr-grid input');
  const obj = {};
  inputs.forEach(i => obj[i.dataset.attr] = Number(i.value) || 0);
  return obj;
}

function writeAttrsToForm(attrs) {
  $all('.attr-grid input').forEach(i => {
    const key = i.dataset.attr;
    i.value = Number(attrs[key] || 0);
  });
}

function updatePointsLeft() {
  const attrs = readAttrsFromForm();
  const sum = totalPoints(attrs);
  $('#pointsLeft').textContent = String(40 - sum);
}

function initCharacters() {
  fillClassSelect();
  updatePointsLeft();
  // Bloquear excesso de pontos
  $all('.attr-grid input').forEach(inp => {
    inp.addEventListener('input', () => {
      const attrs = readAttrsFromForm();
      clampDistribution(attrs, 40);
      writeAttrsToForm(attrs);
      updatePointsLeft();
    });
  });

  $('#resetAttrsBtn').addEventListener('click', () => {
    writeAttrsToForm({ Agilidade: 0, Saúde: 0, Força: 0, Inteligência: 0, Magia: 0, Sorte: 0 });
    updatePointsLeft();
  });

  $('#charForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#charName').value.trim();
    const classKey = $('#charClass').value;
    const attrs = clampDistribution(readAttrsFromForm(), 40);
    const remaining = 40 - totalPoints(attrs);
    if (!name) return alert('Informe um nome.');
    if (remaining !== 0) return alert(`Distribua exatamente 40 pontos. Restantes: ${remaining}`);
    const char = characters.create({ name, classKey, attrs });
    characters.save(char);
    characters.setSelectedId(char.id);
    renderCharacters();
    $('#charForm').reset();
    writeAttrsToForm({ Agilidade: 0, Saúde: 0, Força: 0, Inteligência: 0, Magia: 0, Sorte: 0 });
    updatePointsLeft();
  });

  $('#deleteCharBtn').addEventListener('click', () => {
    const id = characters.getSelectedId();
    if (!id) return;
    if (!confirm('Excluir personagem selecionado?')) return;
    characters.delete(id);
    renderCharacters();
  });

  renderCharacters();
}

function renderCharacters() {
  const list = characters.getAll();
  const ul = $('#charList');
  ul.innerHTML = '';
  const selectedId = characters.getSelectedId();

  for (const c of list) {
    const li = document.createElement('li');
    const cls = getClassByKey(c.classKey);
    const left = document.createElement('div');
    left.innerHTML = `<strong>${c.name}</strong><div class="small">${cls ? cls.nome : c.classKey}</div>`;
    const right = document.createElement('div');
    const btn = document.createElement('button');
    btn.textContent = 'Ver';
    btn.addEventListener('click', () => { characters.setSelectedId(c.id); renderCharacters(); });
    right.appendChild(btn);
    li.appendChild(left);
    li.appendChild(right);
    if (c.id === selectedId) li.style.background = '#eef2ff';
    ul.appendChild(li);
  }

  $('#deleteCharBtn').disabled = !selectedId;

  const details = $('#charDetails');
  details.innerHTML = '';
  if (selectedId) {
    const c = characters.getById(selectedId);
    if (c) {
      const cls = getClassByKey(c.classKey);
      const finalAttrs = applyClassMods(c.attrs, c.classKey);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${c.name} <span class="small">(${cls ? cls.nome : c.classKey})</span></h3>
        <p class="small">${cls?.descricao || ''}</p>
        <div class="hp-bar">
          <strong>HP:</strong> ${c.currentHP || 0} / ${c.maxHP || 0}
        </div>
        <div class="attr-grid" style="margin-top:0.5rem;">
          ${Object.entries(finalAttrs).map(([k,v]) => `<div><strong>${k}</strong><div>${v}</div></div>`).join('')}
        </div>
        ${cls?.habilidades ? `
          <div style="margin-top:1rem;">
            <strong>Habilidades:</strong>
            <ul class="small">
              ${cls.habilidades.map(h => `<li><strong>${h.nome}:</strong> ${h.descricao} (${h.atributo})</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;
      details.appendChild(card);
    }
  }
  
  // Atualiza também a lista de personagens na Mesa
  renderMesaCharacters();
}

function renderMesaCharacters() {
  const container = $('#charactersList');
  const list = characters.getAll();
  
  if (list.length === 0) {
    container.innerHTML = '<p class="muted">Nenhum personagem criado ainda. Vá para a aba Personagens para criar.</p>';
    return;
  }
  
  const battleState = battle.getState();
  const currentTurnCharId = battle.getCurrentCharId();
  
  container.innerHTML = list.map(char => {
    const cls = getClassByKey(char.classKey);
    const finalAttrs = applyClassMods(char.attrs, char.classKey);
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
          <button class="small-btn gm-only apply-damage-btn" data-char-id="${char.id}">Aplicar Dano</button>
          <button class="small-btn gm-only reset-hp-btn" data-char-id="${char.id}">Resetar HP</button>
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners para os botões
  $all('.view-abilities-btn').forEach(btn => {
    btn.addEventListener('click', () => showAbilities(btn.dataset.charId));
  });

  // Botão para aplicar dano manualmente (somente GM)
  $all('.apply-damage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const charId = btn.dataset.charId;
      const char = characters.getById(charId);
      if (!char) return;

      const input = prompt(`Aplicar quanto de dano a ${char.name}? (insira um número positivo)` , '1');
      if (input === null) return; // cancelado
      const amt = Math.max(0, Math.floor(Number(input) || 0));
      if (amt <= 0) return alert('Valor inválido. Insira um número maior que 0.');

      const reason = prompt('Motivo do dano (ex: armadilha, queda, fogo):', 'Ambiente') || 'Ambiente';

      // Aplica dano e registra
      characters.damage(charId, amt);
      addLog({ type: 'damage', text: `${char.name} recebeu ${amt} de dano (${reason}).` });
      renderMesaCharacters();
      renderCharacters();
      renderEnemiesInBattle();
    });
  });

  $all('.reset-hp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      characters.resetHP(btn.dataset.charId);
      renderMesaCharacters();
      addLog({ type: 'heal', text: `HP de ${characters.getById(btn.dataset.charId)?.name} foi restaurado.` });
    });
  });
}

function showAbilities(charId) {
  const char = characters.getById(charId);
  if (!char) return;
  
  const panel = $('#abilityPanel');
  
  // Se já está mostrando este personagem, fecha
  if (panel.style.display === 'block' && panel.dataset.currentCharId === charId) {
    panel.style.display = 'none';
    panel.dataset.currentCharId = '';
    return;
  }
  
  const nameSpan = $('#selectedCharName');
  const abilitiesList = $('#abilitiesList');
  
  nameSpan.textContent = char.name;
  panel.dataset.currentCharId = charId;
  
  const abilities = getClassAbilities(char.classKey);
  const finalAttrs = applyClassMods(char.attrs, char.classKey);
  
  // Lista de alvos possíveis (inimigos vivos)
  const enemyTargets = enemies.getAll().filter(e => e.currentHP > 0);
  const playerTargets = characters.getAll().filter(c => c.currentHP > 0);
  
  abilitiesList.innerHTML = abilities.map(ability => {
    const attrValue = finalAttrs[ability.atributo] || 0;
    const modifier = Math.floor(attrValue / 5);
    
    // Define alvos baseado no tipo de habilidade
    let targetOptions = '';
    if (ability.tipo === 'ataque') {
      // Ataques miram inimigos
      targetOptions = enemyTargets.map(e => `<option value="enemy-${e.id}">${e.name} (HP: ${e.currentHP})</option>`).join('');
    } else if (ability.tipo === 'defesa' || ability.tipo === 'suporte') {
      // Defesa/suporte mira aliados
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
      // Processa alvo do ataque
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
  
  addLog({ type: 'ability', text: logText });
  renderMesaCharacters();
  renderCharacters();
  renderEnemiesInBattle();
}

function initBattle() {
  const startBtn = $('#startBattleBtn');
  const endBtn = $('#endBattleBtn');
  const nextBtn = $('#nextTurnBtn');
  
  startBtn.addEventListener('click', () => {
    const allChars = characters.getAll();
    if (allChars.length === 0) {
      alert('Crie personagens primeiro na aba Personagens!');
      return;
    }
    
    battle.start(allChars.map(c => c.id));
    const currentTurn = battle.getCurrentTurn();
    const turnName = currentTurn?.type === 'gm' ? 'Mestre (GM)' : characters.getById(currentTurn?.id)?.name;
    addLog({ type: 'battle', text: `Combate iniciado! Turno de ${turnName}` });
    updateBattleUI();
  });
  
  endBtn.addEventListener('click', () => {
    if (!confirm('Encerrar o combate?')) return;
    battle.end();
    addLog({ type: 'battle', text: 'Combate encerrado.' });
    updateBattleUI();
  });
  
  nextBtn.addEventListener('click', () => {
    battle.nextTurn();
    const currentTurn = battle.getCurrentTurn();
    const turnName = currentTurn?.type === 'gm' ? 'Mestre (GM)' : characters.getById(currentTurn?.id)?.name;
    addLog({ type: 'turn', text: `Turno de ${turnName}` });
    updateBattleUI();
  });
  
  updateBattleUI();
}

function updateBattleUI() {
  const isActive = battle.isActive();
  const startBtn = $('#startBattleBtn');
  const endBtn = $('#endBattleBtn');
  const turnIndicator = $('#turnIndicator');
  const currentTurnPlayer = $('#currentTurnPlayer');
  
  startBtn.style.display = isActive ? 'none' : '';
  endBtn.style.display = isActive ? '' : 'none';
  turnIndicator.style.display = isActive ? '' : 'none';
  
  if (isActive) {
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

async function loadStory() {
  const storyDisplay = $('#storyDisplay');
  if (!storyDisplay) return;
  
  try {
    const response = await fetch('data/story.json');
    if (!response.ok) throw new Error('Falha ao carregar história');
    
    const story = await response.json();
    
    // Renderiza a história
    let html = `
      <div class="story-container">
        <h3>${story.title || 'História da Campanha'}</h3>
        <p class="muted"><strong>Versão:</strong> ${story.version || '1.0'}</p>
        <p>${story.summary || ''}</p>
        
        ${story.players_template && story.players_template.length > 0 ? `
        <details open>
          <summary><strong>Personagens (Template)</strong></summary>
          <ul>
            ${story.players_template.map(p => `
              <li>
                <strong>${p.name || 'Jogador'}</strong> - HP: ${p.hp || 10}/${p.max_hp || 10}<br>
                ${p.stats ? `Stats: Força ${p.stats.forca || 0}, Agilidade ${p.stats.agilidade || 0}, Inteligência ${p.stats.inteligencia || 0}, Sorte ${p.stats.sorte || 0}` : ''}
              </li>
            `).join('')}
          </ul>
        </details>
        ` : ''}
        
        ${story.parts && story.parts.length > 0 ? story.parts.map(part => `
          <details>
            <summary><strong>Parte ${part.id || '?'}: ${part.title || 'Sem título'}</strong></summary>
            <p>${part.description || ''}</p>
            
            ${part.choices && part.choices.length > 0 ? `
              <h4>Escolhas de Caminho:</h4>
              ${part.choices.map(choice => `
                <div class="story-choice">
                  <strong>${choice.name || 'Opção'}</strong> - ${choice.description || ''}<br>
                  ${choice.test ? `<em>Teste: ${choice.test.stat || ''} ${choice.test.target_text || ''}</em><br>` : ''}
                  ${choice.success_narrative ? `✅ Sucesso: ${choice.success_narrative}<br>` : ''}
                  ${choice.failure_narrative ? `❌ Falha: ${choice.failure_narrative}` : ''}
                </div>
              `).join('')}
              ${part.gm_notes ? `<p class="muted"><em>GM: ${part.gm_notes}</em></p>` : ''}
            ` : ''}
            
            ${part.test && part.test.options && part.test.options.length > 0 ? `
              <h4>Desafio:</h4>
              <p>Opções de teste:</p>
              <ul>
                ${part.test.options.map(opt => `
                  <li>${opt.stat || ''} ${opt.text || ''}</li>
                `).join('')}
              </ul>
              ${part.success && part.success.narrative ? `<p>✅ Sucesso: ${part.success.narrative}</p>` : ''}
              ${part.failure && part.failure.narrative ? `<p>❌ Falha: ${part.failure.narrative}</p>` : ''}
              ${part.gm_notes ? `<p class="muted"><em>GM: ${part.gm_notes}</em></p>` : ''}
            ` : ''}
            
            ${part.combat_setup && part.combat_setup.enemies && part.combat_setup.enemies.length > 0 ? `
              <h4>Combate:</h4>
              <p><strong>Inimigos:</strong></p>
              <ul>
                ${part.combat_setup.enemies.map(enemy => `
                  <li>${enemy.count || 1}x ${enemy.type || 'Inimigo'} - HP: ${enemy.hp || 0}${enemy.attack ? `, Ataque: ${enemy.attack.dice || 'd20'} +${enemy.attack.atk_mod || 0} (acerto ${enemy.attack.hit_target || 10}+), Dano: ${enemy.attack.damage || '1d6'}` : ''}</li>
                `).join('')}
              </ul>
              ${part.actions ? `
              <p><strong>Ações disponíveis:</strong></p>
              <ul>
                ${Object.entries(part.actions).map(([key, action]) => `
                  <li><strong>${key}:</strong> ${action.description || ''} ${action.example || ''}</li>
                `).join('')}
              </ul>
              ` : ''}
              ${part.turns ? `<p class="muted"><em>Ordem: ${part.turns}</em></p>` : ''}
              ${part.gm_tips ? `<p class="muted"><em>GM: ${part.gm_tips}</em></p>` : ''}
            ` : ''}
          </details>
        `).join('') : ''}
        
        ${story.mechanics ? `
        <details>
          <summary><strong>Mecânicas do Jogo</strong></summary>
          <ul>
            ${story.mechanics.dice_notation ? `<li><strong>Dados:</strong> ${story.mechanics.dice_notation}</li>` : ''}
            ${story.mechanics.success_definition ? `<li><strong>Sucesso:</strong> ${story.mechanics.success_definition}</li>` : ''}
            ${story.mechanics.damage_ranges ? `<li><strong>Dano:</strong> ${story.mechanics.damage_ranges}</li>` : ''}
            ${story.mechanics.modifiers ? `<li><strong>Modificadores:</strong> ${story.mechanics.modifiers}</li>` : ''}
          </ul>
        </details>
        ` : ''}
      </div>
    `;
    
    storyDisplay.innerHTML = html;
  } catch (error) {
    console.error('Erro ao carregar história:', error);
    storyDisplay.innerHTML = `<p class="muted">Não foi possível carregar a história. Verifique o arquivo data/story.json</p>`;
  }
}

function initApp() {
  initModeSwitch();
  initTabs();
  renderScenario();
  initAssetsSlideshow();
  renderLog();
  initDice();
  initCharacters();
  initEnemies();
  initBattle();
  renderMesaCharacters();
  renderEnemiesInBattle();
  loadStory();
}

document.addEventListener('DOMContentLoaded', initApp);
