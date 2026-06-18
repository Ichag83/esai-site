# Histórico do projeto — Ice & Code

Resumo das decisões e mudanças feitas nesta sessão de trabalho no site (branch `claude/ice-code-website-design-Ee07R`).

## Contexto

Site institucional da **Ice & Code**, posicionada como agência premium de automação com IA (não uma ferramenta de criativos de anúncios, conceito inicial descartado). Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind + CSS customizado em `src/app/globals.css`.

## Linha do tempo das mudanças

1. **Correção de CSS ausente** — classes `.ic-zoom-deco`, `.deco-ring`, `.deco-orb` eram referenciadas no JSX mas não existiam no CSS; foram adicionadas.
2. **Reposicionamento de marca** — todo o copy do site foi reescrito para refletir "agência de IA premium" em vez de plataforma de criativos. Nav atualizado.
3. **Remoção da seção de preços** — removida por completo; nav passou a apontar para "Contato" no lugar de "Preços".
4. **Polimento visual estilo TwelveLabs** — quatro técnicas aplicadas a pedido do usuário: blobs animados no hero, texto com gradiente nos títulos, glassmorphism nos cards, transições de scroll mais suaves.
5. **Efeito de scroll estilo Mont-Fort (zoom-out no hero)** — contêiner alto (260vh) com seção `sticky`, e transformação de `scale` controlada via scroll (JS) para simular a câmera se afastando do hero conforme o usuário rola a página.
6. **Seção de transição "nuvens"** — passou por várias iterações:
   - Primeiro era um efeito de "nós de automação" (canvas com partículas), substituído por pedido do usuário por nuvens reais.
   - V1: nuvens com elipses borradas em CSS sobre fundo azul-céu.
   - V2 (descartada): nuvens com múltiplos "bumps" + sol com raios — usuário preferiu a V1.
   - Voltou para o visual V1, e o movimento de scroll foi alterado: em vez de só dar zoom numa direção, agora a câmera **sobe acima das nuvens e desce novamente** (curva senoidal aplicada ao scroll), imitando o comportamento original do site de referência.
   - Foi adicionada **neve caindo** sobre a cena, amarrando o efeito à identidade "Ice & Code". Foi corrigido um bug de animação onde a distância de queda usava porcentagem (relativa ao tamanho do próprio floco, quase não movia) — trocado para `vh`.
   - As bordas duras (`border-top`/`border-bottom`) da seção foram removidas e o degradê de transição (`.cb-vignette`) foi alongado, para a seção parar de parecer uma "faixa" colada e se integrar ao fluxo de scroll do site.

## Pendência em aberto

O usuário mandou screenshots do site de referência (`mont-fort.com/maritime/`) mostrando que a técnica real usada lá é **foto cinematográfica em tela cheia** (paisagem com névoa, depois navio visto de cima) com texto sobreposto — bem diferente dos blobs CSS implementados até aqui.

Decisão tomada: migrar a seção de transição para usar uma **foto real (tema gelo/neve)** em vez do efeito 100% CSS, mantendo a coerência com a marca "Ice & Code".

**Bloqueio atual:** o ambiente de execução não tem acesso à internet (sandbox isolado), então não há como buscar/baixar uma imagem livre de direitos automaticamente. Necessário um destes caminhos:
- o usuário enviar um arquivo de imagem diretamente no chat; ou
- recriar a sessão do Claude Code on the web com uma política de rede que permita acesso à internet.

## Próximos passos sugeridos

1. Obter a imagem (upload do usuário ou nova sessão com rede liberada).
2. Criar a seção com a foto em tela cheia, overlay escuro para legibilidade do texto, leve parallax no scroll e indicador de scroll (seta), reaproveitando a neve em CSS por cima se desejado.
3. Testar a integração visual com as seções vizinhas (igual ao ajuste já feito de remover bordas duras / alongar fade).
4. Commit e push para `claude/ice-code-website-design-Ee07R`.

## Como rodar localmente

```bash
cd esai-site
git pull origin claude/ice-code-website-design-Ee07R
npm install
npm run dev
```

Acesse `http://localhost:3000` e role a página até depois da seção de estatísticas para ver a transição.
