import { storage } from './storage.js';

const ENEMIES_KEY = 'enemies';
const SELECTED_ENEMY_KEY = 'selectedEnemyId';

function newId() { return Date.now() + Math.random().toString(36).slice(2, 7); }

export const enemies = {
  getAll() {
    const list = storage.get(ENEMIES_KEY, []);
    // Migração: garantir que inimigos antigos tenham currentHP
    return list.map(enemy => {
      if (enemy.currentHP === undefined) {
        enemy.currentHP = enemy.maxHP;
      }
      return enemy;
    });
  },
  
  save(enemyData) {
    const list = this.getAll();
    const idx = list.findIndex(e => e.id === enemyData.id);
    if (idx >= 0) list[idx] = enemyData; else list.push(enemyData);
    storage.set(ENEMIES_KEY, list);
    return enemyData;
  },
  
  create({ name, maxHP, attacks }) {
    return {
      id: newId(),
      name,
      maxHP: Number(maxHP) || 50,
      currentHP: Number(maxHP) || 50,
      attacks: attacks || [],
      inBattle: false, // Novo campo: se está ativo na mesa
      createdAt: Date.now(),
    };
  },
  
  delete(id) {
    const list = this.getAll();
    const next = list.filter(e => e.id !== id);
    storage.set(ENEMIES_KEY, next);
    const selected = storage.get(SELECTED_ENEMY_KEY, null);
    if (selected === id) storage.remove(SELECTED_ENEMY_KEY);
  },
  
  setSelectedId(id) { storage.set(SELECTED_ENEMY_KEY, id); },
  getSelectedId() { return storage.get(SELECTED_ENEMY_KEY, null); },
  getById(id) { return this.getAll().find(e => e.id === id) || null; },
  
  updateHP(id, newHP) {
    const enemy = this.getById(id);
    if (!enemy) return;
    enemy.currentHP = Math.max(0, Math.min(enemy.maxHP, newHP));
    this.save(enemy);
  },
  
  heal(id, amount) {
    const enemy = this.getById(id);
    if (!enemy) return;
    this.updateHP(id, enemy.currentHP + amount);
  },
  
  damage(id, amount) {
    const enemy = this.getById(id);
    if (!enemy) return;
    this.updateHP(id, enemy.currentHP - amount);
  },
  
  resetHP(id) {
    const enemy = this.getById(id);
    if (!enemy) return;
    enemy.currentHP = enemy.maxHP;
    this.save(enemy);
  },
  
  toggleInBattle(id) {
    const enemy = this.getById(id);
    if (!enemy) return;
    enemy.inBattle = !enemy.inBattle;
    this.save(enemy);
  },
  
  getInBattle() {
    return this.getAll().filter(e => e.inBattle);
  }
};

export function performEnemyAttack(enemyId, attackIndex, targetCharId) {
  const enemy = enemies.getById(enemyId);
  if (!enemy || !enemy.attacks[attackIndex]) {
    return { success: false, message: 'Inimigo ou ataque não encontrado' };
  }
  
  const attack = enemy.attacks[attackIndex];
  
  // Rolagem: d20 vs chance de sucesso
  const roll = 1 + Math.floor(Math.random() * 20);
  const success = roll <= attack.successChance;
  
  return {
    success,
    roll,
    successChance: attack.successChance,
    attack,
    enemy,
    damage: attack.damage || 0
  };
}
