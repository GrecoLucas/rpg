/**
 * Gerenciador de logs do jogo
 */
import { storage } from '../core/storage.js';

const LOG_KEY = 'log';
const MAX_LOGS = 50;

export const logManager = {
  /**
   * Adiciona uma nova entrada no log
   */
  add(entry) {
    const list = storage.get(LOG_KEY, []);
    list.unshift({ 
      id: Date.now(), 
      ts: new Date().toISOString(), 
      ...entry 
    });
    storage.set(LOG_KEY, list.slice(0, MAX_LOGS));
  },

  /**
   * Retorna todos os logs
   */
  getAll() {
    return storage.get(LOG_KEY, []);
  },

  /**
   * Limpa todos os logs
   */
  clear() {
    storage.remove(LOG_KEY);
  }
};
