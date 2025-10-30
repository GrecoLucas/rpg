/**
 * Utilitário de rolagem de dados
 */
export function rollDice(sides, times = 1) {
  const rolls = [];
  for (let i = 0; i < times; i++) {
    rolls.push(1 + Math.floor(Math.random() * sides));
  }
  const total = rolls.reduce((a, b) => a + b, 0);
  return { sides, times, rolls, total };
}
