import { storage } from './storage.js';

const BATTLE_KEY = 'battleState';
const GM_MESSAGES_KEY = 'gmMessages';

export const battle = {
  getState() {
    return storage.get(BATTLE_KEY, {
      active: false,
      turnOrder: [], // Array de {type: 'player'|'gm', id: charId ou 'gm'}
      currentTurnIndex: 0
    });
  },
  
  setState(state) {
    storage.set(BATTLE_KEY, state);
  },
  
  start(characterIds) {
    // Cria ordem de turnos: GM → Jogador → GM → Jogador → ...
    const turnOrder = [];
    characterIds.forEach((charId) => {
      turnOrder.push({ type: 'gm', id: 'gm' });
      turnOrder.push({ type: 'player', id: charId });
    });
    
    this.setState({
      active: true,
      turnOrder: turnOrder,
      currentTurnIndex: 0
    });
  },
  
  nextTurn() {
    const state = this.getState();
    if (!state.active || state.turnOrder.length === 0) return;
    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
    this.setState(state);
  },
  
  getCurrentTurn() {
    const state = this.getState();
    if (!state.active || state.turnOrder.length === 0) return null;
    return state.turnOrder[state.currentTurnIndex];
  },
  
  getCurrentCharId() {
    const turn = this.getCurrentTurn();
    return turn?.type === 'player' ? turn.id : null;
  },
  
  isGMTurn() {
    const turn = this.getCurrentTurn();
    return turn?.type === 'gm';
  },
  
  end() {
    this.setState({
      active: false,
      turnOrder: [],
      currentTurnIndex: 0
    });
  },
  
  isActive() {
    return this.getState().active;
  }
};

export const gmMessages = {
  getAll() {
    return storage.get(GM_MESSAGES_KEY, []);
  },
  
  add(text) {
    const messages = this.getAll();
    messages.unshift({
      id: Date.now(),
      text,
      timestamp: new Date().toISOString()
    });
    storage.set(GM_MESSAGES_KEY, messages.slice(0, 50)); // mantém últimos 50
  },
  
  clear() {
    storage.set(GM_MESSAGES_KEY, []);
  }
};
