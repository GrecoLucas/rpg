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
      ,
      {
        key: 'golpe_preciso',
        nome: 'Golpe Preciso',
        descricao: 'Ataque focado que prioriza acerto — funciona melhor com agilidade.',
        atributo: 'Agilidade',
        dificuldade: 9,
        dano: 10,
        tipo: 'ataque',
        // Bônus de acerto derivado da Agilidade (cada 5 pontos = +1 adicional ao total)
        hitUses: { attribute: 'Agilidade', per: 5, mult: 1 },
        // Pequeno aumento de dano baseado na Força
        damageScale: { attribute: 'Força', per: 5, mult: 2 }
      },
      {
        key: 'golpe_furioso',
        nome: 'Golpe Furioso',
        descricao: 'Ataque pesado que usa força para aumentar o dano, porém é mais difícil de executar.',
        atributo: 'Força',
        dificuldade: 14,
        dano: 22,
        tipo: 'ataque',
        // Dano escala fortemente com Força
        damageScale: { attribute: 'Força', per: 4, mult: 4 },
        // Chance de crítico baseada na Sorte (valor entre 0 e 1)
        critChance: 0.05,
        critMult: 2
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
      ,
      {
        key: 'rajada_arcana',
        nome: 'Rajada Arcana',
        descricao: 'Surtos de energia mágica que se beneficiam da Inteligência e Magia.',
        atributo: 'Magia',
        dificuldade: 11,
        dano: 18,
        tipo: 'ataque',
        // Dano escala com Magia
        damageScale: { attribute: 'Magia', per: 4, mult: 3 },
        // Inteligência dá bônus de acerto
        hitUses: { attribute: 'Inteligência', per: 5, mult: 1 }
      },
      {
        key: 'escudo_arcano',
        nome: 'Escudo Arcano',
        descricao: 'Cria uma barreira mágica que regenera HP ou absorve dano; melhor com Inteligência.',
        atributo: 'Inteligência',
        dificuldade: 10,
        cura: 12,
        tipo: 'defesa',
        // Cura aumenta com Inteligência
        healScale: { attribute: 'Inteligência', per: 5, mult: 3 }
      }
    ]
  },
];
