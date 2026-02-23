-- Seed: initial patterns for Creative Brain BR
-- Run after 001_initial.sql

insert into public.patterns
  (platform, product_category, marketplace_context, pattern_name, hook_formula, structure, script_skeleton, why_it_works, editing_notes, tags)
values
  (
    'tiktok',
    'ferramentas',
    'none',
    'Você ainda faz assim?',
    '"Você ainda faz {{tarefa}} desse jeito? Olha isso…"',
    'DEMO',
    '1) Hook com comparação. 2) Mostra o problema comum. 3) Demonstra solução com o produto. 4) Benefício principal em 1 frase. 5) Prova rápida (antes/depois). 6) CTA direto com oferta/frete/pix.',
    'Ataca hábito antigo + entrega demonstração rápida + prova visual.',
    '{"captions":"always","pacing":"fast","cuts":"many","framing":"closeup","style":["demo","ugc"]}',
    ARRAY['demo','comparacao','diy']
  ),
  (
    'meta',
    'ferramentas',
    'mercado_livre',
    '3 motivos em 15s',
    '"3 motivos pra você escolher {{produto}} hoje."',
    'LISTA_3',
    '1) Hook lista. 2) Motivo 1 (benefício). 3) Motivo 2 (prova/qualidade). 4) Motivo 3 (oferta: frete/pix/garantia). 5) CTA.',
    'Checklist rápido e objetivo, bom para feed e Reels.',
    '{"captions":"always","pacing":"fast","cuts":"some","framing":"mixed","style":["ugc","review"]}',
    ARRAY['lista','oferta','claridade']
  ),
  (
    'tiktok',
    'geral',
    'shopee',
    'Vale a pena?',
    '"{{produto}} vale a pena ou é furada? Testei de verdade."',
    'REVIEW',
    '1) Hook com dúvida. 2) Mostra expectativa vs realidade. 3) Teste real (1 cenário). 4) Ponto forte + limitação honesta. 5) Fechamento com recomendação. 6) CTA.',
    'Autenticidade + teste real + reduz medo de comprar.',
    '{"captions":"always","pacing":"fast","cuts":"many","framing":"closeup","style":["ugc","review"]}',
    ARRAY['review','teste','confianca']
  ),
  (
    'meta',
    'geral',
    'instagram',
    'Antes e Depois',
    '"Olha esse antes/depois…"',
    'ANTES_DEPOIS',
    '1) Hook visual antes/depois. 2) O que era o problema. 3) O que você fez com o produto. 4) Resultado final. 5) CTA.',
    'Prova visual imediata, funciona bem em Reels.',
    '{"captions":"sometimes","pacing":"fast","cuts":"some","framing":"mixed","style":["demo"]}',
    ARRAY['antes_depois','prova']
  ),
  (
    'tiktok',
    'geral',
    'tiktok_shop',
    'Preço vs benefício',
    '"Por {{preco}} isso aqui faz {{beneficio}}…"',
    'PAS',
    '1) Hook com preço+benefício. 2) Dor do público. 3) Solução com o produto. 4) Prova rápida. 5) CTA com urgência leve.',
    'Ancoragem de valor e clareza de compra.',
    '{"captions":"always","pacing":"fast","cuts":"many","framing":"closeup","style":["ugc","demo"]}',
    ARRAY['valor','preco','conversao']
  ),
  (
    'universal',
    'geral',
    'none',
    'Objeção: confiança',
    '"Se você tem medo de comprar {{tipo_produto}} pela internet, presta atenção…"',
    'AIDA',
    '1) Hook com objeção. 2) Empatia e contexto. 3) Prova (material/garantia/depoimento). 4) Oferta clara (frete/pix). 5) CTA.',
    'Remove atrito e aumenta conversão em público frio.',
    '{"captions":"always","pacing":"medium","cuts":"some","framing":"mixed","style":["ugc","voiceover"]}',
    ARRAY['confianca','objeção']
  ),
  (
    'tiktok',
    'geral',
    'none',
    'Curiosidade + Reveal',
    '"Ninguém te conta isso sobre {{produto}}…"',
    'AIDA',
    '1) Hook de curiosidade. 2) Setup do problema oculto. 3) Reveal do diferencial. 4) Demonstração rápida. 5) CTA.',
    'Loop de curiosidade prende atenção nos primeiros 2s.',
    '{"captions":"always","pacing":"fast","cuts":"many","framing":"closeup","style":["ugc","voiceover"]}',
    ARRAY['curiosidade','reveal','engajamento']
  ),
  (
    'meta',
    'geral',
    'none',
    'Prova Social Rápida',
    '"Mais de {{numero}} pessoas já compraram — veja o que acharam."',
    'PROVA_SOCIAL',
    '1) Hook com número. 2) Depoimento 1 (problema resolvido). 3) Depoimento 2 (resultado). 4) Benefício principal reforçado. 5) CTA com oferta.',
    'Números + depoimentos reais derrubam barreiras de compra.',
    '{"captions":"always","pacing":"medium","cuts":"some","framing":"mixed","style":["ugc","review"]}',
    ARRAY['prova_social','numeros','confianca']
  ),
  (
    'tiktok',
    'geral',
    'mercado_livre',
    'Tutorial Rápido',
    '"Aprenda a usar {{produto}} em 30 segundos."',
    'TUTORIAL',
    '1) Hook com promessa de aprendizado rápido. 2) Passo 1 (setup). 3) Passo 2 (uso principal). 4) Resultado. 5) Onde comprar + CTA.',
    'Educa e demonstra ao mesmo tempo, aumenta confiança pré-compra.',
    '{"captions":"always","pacing":"fast","cuts":"many","framing":"closeup","style":["demo","tutorial"]}',
    ARRAY['tutorial','educativo','demo']
  ),
  (
    'universal',
    'geral',
    'none',
    'Urgência de Estoque',
    '"Atenção: últimas unidades de {{produto}} com esse preço."',
    'PAS',
    '1) Hook de escassez. 2) Benefício central em 1 frase. 3) Prova de qualidade rápida. 4) Oferta (preço/frete/pix). 5) CTA urgente.',
    'Escassez real aumenta conversão imediata.',
    '{"captions":"always","pacing":"fast","cuts":"some","framing":"mixed","style":["ugc","voiceover"]}',
    ARRAY['urgencia','escassez','oferta']
  );
