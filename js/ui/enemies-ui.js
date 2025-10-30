/**
 * Interface de gerenciamento de inimigos
 */
import { $, $all } from '../core/utils.js';
import { enemies } from '../core/enemies.js';

let attackCounter = 0;

/**
 * Adiciona um campo de ataque ao formulário
 */
function addAttackField() {
  const container = $('#attacksList');
  if (!container) return;
  
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

/**
 * Renderiza a lista de inimigos
 */
export function renderEnemies() {
  const list = enemies.getAll();
  const ul = $('#enemiesList');
  if (!ul) return;
  
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
      document.dispatchEvent(new CustomEvent('enemiesUpdated'));
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
  
  const deleteBtn = $('#deleteEnemyBtn');
  if (deleteBtn) {
    deleteBtn.disabled = !selectedId;
  }
}

/**
 * Inicializa a interface de inimigos
 */
export function initEnemiesUI() {
  const form = $('#enemyForm');
  const deleteBtn = $('#deleteEnemyBtn');
  const addAttackBtn = $('#addAttackBtn');
  const resetBtn = $('#resetEnemyFormBtn');
  
  if (!form) return;
  
  // Adiciona primeiro ataque por padrão
  addAttackField();
  
  if (addAttackBtn) {
    addAttackBtn.addEventListener('click', addAttackField);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      $('#attacksList').innerHTML = '';
      attackCounter = 0;
      addAttackField();
    });
  }
  
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
    document.dispatchEvent(new CustomEvent('enemiesUpdated'));
  });
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const id = enemies.getSelectedId();
      if (!id) return;
      if (!confirm('Excluir inimigo selecionado?')) return;
      enemies.delete(id);
      renderEnemies();
      document.dispatchEvent(new CustomEvent('enemiesUpdated'));
    });
  }
  
  renderEnemies();
}
