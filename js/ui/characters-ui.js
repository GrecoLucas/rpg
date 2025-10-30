/**
 * Interface de gerenciamento de personagens
 */
import { $, $all } from '../core/utils.js';
import { characters, classesData, getClassByKey, applyClassMods, totalPoints, clampDistribution } from '../core/characters.js';

let selectedCharId = null;

/**
 * Preenche o select de classes
 */
function fillClassSelect() {
  const sel = $('#charClass');
  if (!sel) return;
  
  sel.innerHTML = '';
  for (const cls of classesData) {
    const opt = document.createElement('option');
    opt.value = cls.key;
    opt.textContent = cls.nome;
    sel.appendChild(opt);
  }
  
  // Adiciona listener para mostrar habilidades ao mudar classe
  sel.addEventListener('change', () => {
    showClassAbilitiesPreview(sel.value);
  });
  
  // Mostra habilidades da primeira classe por padrão
  showClassAbilitiesPreview(sel.value);
}

/**
 * Mostra preview das habilidades de uma classe
 */
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
  if (attributesDiv) {
    attributesDiv.appendChild(container);
  }
}

/**
 * Lê atributos do formulário
 */
function readAttrsFromForm() {
  const inputs = $all('.attr-grid input');
  const obj = {};
  inputs.forEach(i => obj[i.dataset.attr] = Number(i.value) || 0);
  return obj;
}

/**
 * Escreve atributos no formulário
 */
function writeAttrsToForm(attrs) {
  $all('.attr-grid input').forEach(i => {
    const key = i.dataset.attr;
    i.value = Number(attrs[key] || 0);
  });
}

/**
 * Atualiza contador de pontos restantes
 */
function updatePointsLeft() {
  const attrs = readAttrsFromForm();
  const sum = totalPoints(attrs);
  const pointsLeftEl = $('#pointsLeft');
  if (pointsLeftEl) {
    pointsLeftEl.textContent = String(40 - sum);
  }
}

/**
 * Renderiza a lista de personagens
 */
export function renderCharacters() {
  const list = characters.getAll();
  const ul = $('#charList');
  if (!ul) return;
  
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
    btn.addEventListener('click', () => { 
      characters.setSelectedId(c.id); 
      renderCharacters(); 
    });
    right.appendChild(btn);
    li.appendChild(left);
    li.appendChild(right);
    if (c.id === selectedId) li.style.background = '#eef2ff';
    ul.appendChild(li);
  }

  const deleteBtn = $('#deleteCharBtn');
  if (deleteBtn) {
    deleteBtn.disabled = !selectedId;
  }

  // Renderiza detalhes do personagem selecionado
  renderCharacterDetails(selectedId);
  
  // Atualiza também a lista de personagens na Mesa
  document.dispatchEvent(new CustomEvent('charactersUpdated'));
}

/**
 * Renderiza os detalhes de um personagem
 */
function renderCharacterDetails(charId) {
  const details = $('#charDetails');
  if (!details) return;
  
  details.innerHTML = '';
  
  if (!charId) return;
  
  const c = characters.getById(charId);
  if (!c) return;
  
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

/**
 * Inicializa a interface de personagens
 */
export function initCharactersUI() {
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

  const resetBtn = $('#resetAttrsBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      writeAttrsToForm({ Agilidade: 0, Saúde: 0, Força: 0, Inteligência: 0, Magia: 0, Sorte: 0 });
      updatePointsLeft();
    });
  }

  const form = $('#charForm');
  if (form) {
    form.addEventListener('submit', (e) => {
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
      
      form.reset();
      writeAttrsToForm({ Agilidade: 0, Saúde: 0, Força: 0, Inteligência: 0, Magia: 0, Sorte: 0 });
      updatePointsLeft();
    });
  }

  const deleteBtn = $('#deleteCharBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const id = characters.getSelectedId();
      if (!id) return;
      if (!confirm('Excluir personagem selecionado?')) return;
      characters.delete(id);
      renderCharacters();
    });
  }

  renderCharacters();
}
