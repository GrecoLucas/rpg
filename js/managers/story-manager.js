/**
 * Gerenciador de história e narrativa
 */

export const storyManager = {
  /**
   * Carrega a história do arquivo JSON
   */
  async loadStory() {
    try {
      const response = await fetch('data/story.json');
      if (!response.ok) throw new Error('Falha ao carregar história');
      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar história:', error);
      return null;
    }
  }
};
