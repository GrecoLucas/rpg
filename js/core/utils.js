/**
 * Utilidades gerais e helpers compartilhados
 */

// Seletores DOM simplificados
export function $(sel, root = document) { 
  return root.querySelector(sel); 
}

export function $all(sel, root = document) { 
  return Array.from(root.querySelectorAll(sel)); 
}

// Gerador de IDs únicos
export function newId() { 
  return Date.now() + Math.random().toString(36).slice(2, 7); 
}

// Formatação de data/hora
export function formatTimestamp(ts) {
  return new Date(ts).toLocaleTimeString();
}

// Clamp de valor entre min e max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
