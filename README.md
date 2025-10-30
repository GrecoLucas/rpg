# RPG de Mesa Offline

Site simples, 100% offline, para jogar RPG de mesa localmente com modo GM e Jogador.

## O que tem
- Modo GM e Jogador (alternável no topo).
- Cenário (imagem) visível para todos, controlado pelo GM.
- Notas secretas do GM salvas localmente (não aparecem no modo Jogador).
- Rolagem de dados (d4 a d100) com registro visível.
- Criação de personagem:
  - 3 classes pré-definidas (Guerreiro, Ladino, Mago).
  - Distribuição de 40 pontos entre Agilidade, Saúde, Força, Inteligência, Magia e Sorte.
  - Lista e visualização de personagens salvos.

## Como usar (Windows)
1. Baixe/clone a pasta do projeto no seu PC.
2. Dê dois cliques em `index.html` para abrir no navegador (funciona direto sem internet).
3. No topo, escolha o modo: `GM` ou `Jogador`.
4. Abas:
   - Mesa: mostra o cenário, rolagem de dados e registro.
   - Personagens: crie e gerencie fichas.
   - Mestre (apenas no modo GM): trocar cenário e editar notas secretas.

Dica: Como é local e offline, todas as informações ficam salvas no `localStorage` do navegador (no mesmo computador/usuário/navegador).

## Estrutura
```
assets/placeholder.png  # imagem padrão do cenário
css/styles.css                   # estilos básicos
data/classes.js                  # dados das classes (sem fetch)
js/app.js                        # inicialização e lógica de UI
js/characters.js                 # gerenciamento de personagens
js/dice.js                       # rolagens de dados
js/storage.js                    # persistência em localStorage
index.html                       # página principal
```

## Observações
- Para compartilhar informações entre vários dispositivos ao mesmo tempo, seria preciso um servidor/sincronização (fora do escopo deste projeto offline). Para jogar em família, usem a mesma tela alternando o modo.
- Você pode substituir a imagem do cenário por qualquer arquivo `.png/.jpg/.webp/.svg` via aba Mestre.
