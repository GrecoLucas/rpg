import { storage } from './storage.js';
import { CLASSES } from '../data/classes.js';

const CHAR_KEY = 'characters';
const SELECTED_KEY = 'selectedCharacterId';

function newId() { return Date.now() + Math.random().toString(36).slice(2, 7); }

export const classesData = CLASSES;

export const characters = {
  getAll() {
    const list = storage.get(CHAR_KEY, []);
    // Migração: adicionar HP para personagens antigos
    return list.map(char => {
      if (!char.maxHP) {
        const finalAttrs = applyClassMods(char.attrs, char.classKey);
        char.maxHP = Math.max(20, finalAttrs.Saúde * 5);
        char.currentHP = char.maxHP;
      }
      return char;
    });
  },
  save(charData) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === charData.id);
    if (idx >= 0) list[idx] = charData; else list.push(charData);
    storage.set(CHAR_KEY, list);
    return charData;
  },
  create({ name, classKey, attrs }) {
    const finalAttrs = applyClassMods(attrs, classKey);
    const maxHP = Math.max(20, finalAttrs.Saúde * 5); // HP baseado em Saúde
    return {
      id: newId(),
      name,
      classKey,
      attrs, // distribuicao do jogador
      currentHP: maxHP,
      maxHP: maxHP,
      createdAt: Date.now(),
    };
  },
  delete(id) {
    const list = storage.get(CHAR_KEY, []);
    const next = list.filter(c => c.id !== id);
    storage.set(CHAR_KEY, next);
    const selected = storage.get(SELECTED_KEY, null);
    if (selected === id) storage.remove(SELECTED_KEY);
  },
  setSelectedId(id) { storage.set(SELECTED_KEY, id); },
  getSelectedId() { return storage.get(SELECTED_KEY, null); },
  getById(id) { return this.getAll().find(c => c.id === id) || null; },
  updateHP(id, newHP) {
    const char = this.getById(id);
    if (!char) return;
    char.currentHP = Math.max(0, Math.min(char.maxHP, newHP));
    this.save(char);
  },
  heal(id, amount) {
    const char = this.getById(id);
    if (!char) return;
    this.updateHP(id, char.currentHP + amount);
  },
  damage(id, amount) {
    const char = this.getById(id);
    if (!char) return;
    this.updateHP(id, char.currentHP - amount);
  },
  resetHP(id) {
    const char = this.getById(id);
    if (!char) return;
    char.currentHP = char.maxHP;
    this.save(char);
  }
};

export function getClassByKey(key) {
  return CLASSES.find(c => c.key === key) || null;
}

export function totalPoints(attrs) {
  return Object.values(attrs).reduce((a, b) => a + (Number(b) || 0), 0);
}

export function clampDistribution(attrs, maxTotal = 40) {
  // Se exceder, reduz o último atributo para caber.
  const keys = Object.keys(attrs);
  let sum = totalPoints(attrs);
  if (sum <= maxTotal) return attrs;
  for (let i = keys.length - 1; i >= 0 && sum > maxTotal; i--) {
    const k = keys[i];
    const over = sum - maxTotal;
    const reduceBy = Math.min(over, Number(attrs[k]) || 0);
    attrs[k] = Math.max(0, (Number(attrs[k]) || 0) - reduceBy);
    sum = totalPoints(attrs);
  }
  return attrs;
}

export function applyClassMods(attrs, classKey) {
  const base = { ...attrs };
  const cls = getClassByKey(classKey);
  if (!cls) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(cls.mods)) {
    out[k] = (Number(out[k]) || 0) + (Number(v) || 0);
  }
  return out;
}

export function getClassAbilities(classKey) {
  const cls = getClassByKey(classKey);
  return cls?.habilidades || [];
}

export function calculateAbilitySuccess(charId, abilityKey) {
  const char = characters.getById(charId);
  if (!char) return { success: false, message: 'Personagem não encontrado' };
  
  const cls = getClassByKey(char.classKey);
  if (!cls) return { success: false, message: 'Classe não encontrada' };
  
  const ability = cls.habilidades.find(h => h.key === abilityKey);
  if (!ability) return { success: false, message: 'Habilidade não encontrada' };
  
  const finalAttrs = applyClassMods(char.attrs, char.classKey);
  const attrValue = finalAttrs[ability.atributo] || 0;
  
  // Rolagem: d20 + modificador de atributo vs dificuldade
  const roll = 1 + Math.floor(Math.random() * 20);
  const modifier = Math.floor(attrValue / 5); // cada 5 pontos = +1 de bônus
  const total = roll + modifier;
  const success = total >= ability.dificuldade;
  
  return {
    success,
    roll,
    modifier,
    total,
    difficulty: ability.dificuldade,
    ability,
    char
  };
}
