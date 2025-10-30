// Dados das classes pré-definidas (JS module para funcionar offline sem fetch)
// Cada classe possui um identificador, nome, descrição, modificadores e habilidades.
export const CLASSES = [
  {
    key: 'guerreiro',
    nome: 'Guerreiro',
    descricao: 'Combatente corpo-a-corpo robusto, treinado em armas e armaduras.',
    mods: { Agilidade: 2, Saúde: 6, Força: 6, Inteligência: 0, Magia: 0, Sorte: 1 },
    habilidades: [
      {
        key: 'atacar_espada',
        nome: 'Atacar com Espada',
        descricao: 'Desfere um poderoso golpe com a espada',
        atributo: 'Força',
        dificuldade: 10,
        dano: 15,
        tipo: 'ataque'
      },
      {
        key: 'defender_escudo',
        nome: 'Defender com Escudo',
        descricao: 'Levanta o escudo para se proteger',
        atributo: 'Saúde',
        dificuldade: 8,
        cura: 10,
        tipo: 'defesa'
      }
    ]
  },
  {
    key: 'mago',
    nome: 'Mago',
    descricao: 'Mestre das artes arcanas, frágil porém poderoso em Magia.',
    mods: { Agilidade: 0, Saúde: 1, Força: 0, Inteligência: 6, Magia: 8, Sorte: 0 },
    habilidades: [
      {
        key: 'bola_fogo',
        nome: 'Lançar Bola de Fogo',
        descricao: 'Conjura uma bola de fogo devastadora',
        atributo: 'Magia',
        dificuldade: 12,
        dano: 25,
        tipo: 'ataque'
      },
      {
        key: 'bencao',
        nome: 'Fazer Benção',
        descricao: 'Aumenta a saúde de todos os aliados',
        atributo: 'Magia',
        dificuldade: 10,
        cura: 15,
        curaTodos: true,
        tipo: 'suporte'
      }
    ]
  },
];
