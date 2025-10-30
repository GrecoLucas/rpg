/**
 * Gerenciador de cenários e capas
 */
import { storage } from '../core/storage.js';

const SCENARIO_KEY = 'scenarioImage';

export const scenarioManager = {
  /**
   * Retorna o caminho da imagem do cenário atual
   */
  getCurrent() {
    return storage.get(SCENARIO_KEY, 'assets/placeholder.svg');
  },

  /**
   * Define uma nova imagem de cenário
   */
  setCurrent(imagePath) {
    storage.set(SCENARIO_KEY, imagePath);
  },

  /**
   * Carrega a lista de assets disponíveis
   */
  async loadAvailableAssets() {
    try {
      const response = await fetch('assets/manifest.json');
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error('Erro ao carregar manifest:', error);
      return [];
    }
  }
};
