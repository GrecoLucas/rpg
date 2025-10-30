// Armazenamento simples em localStorage com JSON
const PREFIX = 'rpg_offline_v1';

function k(name) { return `${PREFIX}:${name}`; }

export const storage = {
  get(name, fallback = null) {
    try {
      const raw = localStorage.getItem(k(name));
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(name, value) {
    localStorage.setItem(k(name), JSON.stringify(value));
  },
  remove(name) {
    localStorage.removeItem(k(name));
  }
};
