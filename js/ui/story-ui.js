/**
 * Interface de visualização da história
 */
import { $ } from '../core/utils.js';
import { storyManager } from '../managers/story-manager.js';

/**
 * Carrega e renderiza a história
 */
export async function loadAndRenderStory() {
  const storyDisplay = $('#storyDisplay');
  if (!storyDisplay) return;
  
  const story = await storyManager.loadStory();
  
  if (!story) {
    storyDisplay.innerHTML = `<p class="muted">Não foi possível carregar a história. Verifique o arquivo data/story.json</p>`;
    return;
  }
  
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
}
