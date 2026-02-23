# Análise do workflow n8n — WhatsApp + IA + Supabase

## Mapa atual (nó a nó)

1. **Webhook** (`Webhook`) recebe evento WhatsApp (`POST /whatsapp`).
2. **Normalização inicial** (`Dados`) extrai campos-base: `instance`, `remoteJid`, `fromMe`, `pushname`, `conversation`, `messagetype`, `phone`, etc.
3. **Filtro de eco** (`é minha mensagem?`): se `fromMe == true`, encerra em `No Operation, do nothing`.
4. **Roteamento por tipo de mensagem** (`tipo de mensagem`): separa `conversation`, `ephemeralMessage`, `extendedtextMessage`, `audioMessage`, `imageMessage`, `stickerMessage`, `videoMessage`.
5. **Extração de texto por tipo**:
   - Texto: `Message Conversation`, `Message Ephemeral`, `Message ExtendedMessage`.
   - Mídia: `Message Audio`, `Message Image`, `Message Figurinhas`, `Message Video` geram resposta fixa de indisponibilidade.
6. **Merge textual** (`Merge`, 3 inputs): unifica apenas os 3 caminhos textuais para continuar pipeline IA.
7. **Contexto de identificação** (`Normalize IDs`): monta `phone`, `incoming_message`, `org_id`, `channel_id`.
8. **Contato no Supabase**:
   - `Get many rows` busca contato em `contacts` por `org_id + phone`.
   - `If` decide se já existe.
   - `Create a row` cria contato quando não existe.
9. **Contexto final para IA** (`Attach message context`) injeta `incoming_message`, `message`, `channel_id`, `org_id`.
10. **LLM/Agente**:
   - `AI Agent` com prompt extenso de política operacional ESAI.
   - `OpenAI Chat Model` (gpt-4o-mini).
   - `Simple Memory` (janela 10, chave de sessão `remoteJid`).
11. **Pós-processamento de saída da IA** (`mensagem do agente`) mapeia `output -> message`.
12. **Merge de respostas finais** (`mensagem final`, 5 inputs): combina resposta da IA + respostas fixas de mídia.
13. **Delay operacional** (`Wait`, 20s).
14. **Envio WhatsApp** (`HTTP Request`): POST `sendText` usando `server_url`, `instance`, `apikey`, `remoteJid`, `message`.

## O que já existe

- Entrada webhook funcional para WhatsApp.
- Filtro de mensagens enviadas pelo próprio bot (`fromMe`).
- Roteamento básico por tipo de mensagem.
- Fallback para mídia não suportada (áudio/imagem/sticker/vídeo).
- Camada de IA com prompt de negócio robusto.
- Memória conversacional de curto prazo no n8n (`Simple Memory`).
- Cadastro/lookup de contatos no Supabase (`contacts`).
- Delay antes de envio (reduz efeito “robótico”).

## Gaps (o que falta)

1. **Deduplicação por `message_id`**
   - Não há captura de `message_id` (`data.key.id`) nem trava idempotente.
   - Risco: reentrega do webhook => respostas duplicadas.

2. **Histórico inbound/outbound persistente**
   - Só há `contacts`; não há tabela de mensagens.
   - Sem trilha auditável completa de conversa.

3. **Estado da conversa (`conversation_state`)**
   - Estado está implícito na memória volátil do n8n.
   - Sem persistência para handoff/follow-up/reentrada.

4. **Pausa IA / handoff humano**
   - Não existe gate operacional para bloquear IA por contato.
   - Não há fila/status de atendimento humano.

5. **Roteador determinístico antes do LLM**
   - Todo texto vai direto ao agente (após extração).
   - Faltam regras fixas para intents críticas (ex.: “quero contratar”, “falar com humano”, “status”).

6. **Transcrição de áudio**
   - Áudio recebe resposta estática de indisponibilidade.
   - Falta pipeline download -> STT -> texto.

7. **Agentes especialistas (RAG/agendamento)**
   - Existe somente um agente geral sem tools conectadas.
   - Sem recuperação de base documental e sem agenda.

8. **Follow-up automático (24h / 2 dias)**
   - Não há scheduler/cron nem regras de janela de inatividade.

9. **Logs/retries/observabilidade**
   - HTTP de envio sem estratégia de retry/backoff estruturada.
   - Sem correlação de execução (`trace_id`) persistida.
   - Sem métricas de falha por nó/canal.

10. **Guardrails operacionais adicionais**
   - Prompt ajuda, mas faltam travas sistêmicas: rate-limit por contato, circuit breaker de provedor, bloqueio por opt-out/LGPD.

## Plano de implementação por fases (baixo risco primeiro)

### Fase 1 — Idempotência + histórico mínimo (baixo risco)
- Adicionar captura de `message_id` no `Dados`.
- Criar tabela `messages` com unique (`org_id`, `channel_id`, `message_id`).
- Inserir nó de **upsert/insert** inbound antes do `tipo de mensagem`.
- Se conflito/duplicado => encerrar fluxo sem responder.
- Registrar outbound após `HTTP Request` (status, provider_message_id, payload).

### Fase 2 — Estado persistente + handoff humano
- Criar tabela `conversation_state` por contato/canal.
- Ler estado antes do `AI Agent`:
  - `ai_paused = true` => resposta padrão + encaminhar humano.
  - `handoff_status = open` => não chamar LLM.
- Atualizar estado após cada interação (última mensagem, última resposta, etapa de qualificação).

### Fase 3 — Roteador determinístico pré-LLM
- Inserir `Switch/If` para intents de alta confiança antes do agente:
  - `HUMAN_HANDOFF`, `PRICING`, `STATUS_PROCESSO`, `OPT_OUT`, `MÍDIA`.
- Apenas intents desconhecidas seguem para LLM.
- Ganho: custo menor, previsibilidade maior, menos risco regulatório.

### Fase 4 — Áudio + especialistas
- Substituir caminho `Message Audio` por:
  - download binário do áudio,
  - transcrição (OpenAI/Whisper ou outro STT),
  - reaproveitar pipeline textual.
- Adicionar tools no agente:
  - **RAG** (consulta FAQ/base legal/versionada),
  - **Agendamento** (consulta slots + criar evento).

### Fase 5 — Follow-up + observabilidade avançada
- Workflow separado com `Cron` (24h e 48h) lendo `conversation_state/messages`.
- Disparar follow-up só se sem resposta do usuário e sem opt-out/handoff aberto.
- Instrumentar logs estruturados + retries/backoff + DLQ (dead-letter queue).

## Alterações incrementais no JSON (preservando IDs e conexões)

> Estratégia: **editar nós existentes** e inserir nós novos em pontos de acoplamento estáveis.

### Editar nós existentes
1. **`Dados`**
   - Adicionar campos:
     - `message_id = {{$json.body.data.key.id}}`
     - `timestamp_unix = {{$json.body.data.messageTimestamp}}`
     - `raw_payload = {{JSON.stringify($json.body)}}`
2. **`Normalize IDs`**
   - Propagar `message_id`, `timestamp_unix`, `messagetype`, `instance`.
3. **`HTTP Request`**
   - Capturar e propagar resposta do provider (`statusCode`, `id` retorno).

### Adicionar nós (sem quebrar tronco atual)
1. **Entre `Dados` -> `é minha mensagem?`**
   - `Set Trace` (gera `trace_id`).
2. **Após `Normalize IDs` (antes de IA)**
   - `Supabase Insert Inbound` (messages inbound).
   - `If Duplicado?` (quando conflito/registro existente): ramo true -> `No Operation`.
3. **Após `Attach message context`**
   - `Supabase Get conversation_state`.
   - `If ai_paused/handoff_open`.
4. **Antes do `AI Agent`**
   - `Switch Intent Determinística` (palavras-chave e regex).
5. **No ramo de áudio (`Message Audio`)**
   - trocar Set fixo por pipeline STT (download -> transcribe -> merge no caminho textual).
6. **Após `HTTP Request`**
   - `Supabase Insert Outbound`.
   - `If erro envio` -> `Retry` (Wait exponencial) -> reenvio controlado.

## Campos/tabelas Supabase sugeridos

### 1) `messages`
- `id` (uuid pk)
- `org_id` (uuid, index)
- `channel_id` (uuid, index)
- `contact_id` (uuid, nullable)
- `direction` (text: inbound/outbound)
- `message_id` (text)
- `provider` (text: evolution/whatsapp)
- `provider_message_id` (text, nullable)
- `remote_jid` (text)
- `phone` (text, index)
- `message_type` (text)
- `content_text` (text)
- `media_url` (text, nullable)
- `raw_payload` (jsonb)
- `trace_id` (uuid/text, index)
- `status` (text: received, processed, sent, failed, duplicated)
- `error_code` (text, nullable)
- `error_detail` (text, nullable)
- `created_at` (timestamptz default now())

**Constraint chave**: `unique (org_id, channel_id, direction, message_id)`.

### 2) `conversation_state`
- `id` (uuid pk)
- `org_id`, `channel_id`, `contact_id`, `phone`
- `state` (text: new, qualifying, qualified, handoff, closed)
- `ai_paused` (bool default false)
- `handoff_status` (text: none/open/closed)
- `handoff_reason` (text)
- `last_inbound_at`, `last_outbound_at` (timestamptz)
- `last_intent` (text)
- `lead_temperature` (text)
- `owner_user_id` (uuid nullable)
- `followup_stage` (int default 0)
- `next_followup_at` (timestamptz nullable)
- `opt_out` (bool default false)
- `updated_at` (timestamptz)

**Constraint chave**: `unique (org_id, channel_id, phone)`.

### 3) `workflow_events` (observabilidade)
- `id`, `trace_id`, `workflow_id`, `node_name`, `level`, `event`, `payload`, `created_at`.

## Riscos de quebra + mitigação

1. **Mudança de ordem de Merge/Switch**
   - Risco: branch sem `message` chegar ao envio.
   - Mitigação: manter contrato `message` obrigatório antes de `mensagem final`.

2. **Dedup mal configurada**
   - Risco: bloquear mensagens legítimas (ex.: `message_id` vazio).
   - Mitigação: fallback key composta (`remoteJid + timestamp + hash conteúdo`) quando `message_id` ausente.

3. **Persistência síncrona lenta**
   - Risco: latência maior no SLA de resposta.
   - Mitigação: usar inserts enxutos + timeout + fila assíncrona para eventos não críticos.

4. **Handoff/pausa travando atendimento**
   - Risco: contato fica preso em `ai_paused=true`.
   - Mitigação: comando administrativo para release + TTL opcional de pausa.

5. **Transcrição de áudio custosa/instável**
   - Risco: aumento de custo e falhas em mídia longa.
   - Mitigação: limite de duração/tamanho + fallback com mensagem amigável.

6. **Roteador determinístico com falso positivo**
   - Risco: classificar errado e evitar LLM quando deveria escalar.
   - Mitigação: regras conservadoras + monitorar taxa de override.

## Testes de validação recomendados

### Funcionais
1. Texto simples inbound -> IA responde -> outbound enviado -> ambos logados em `messages`.
2. Reentrega do mesmo `message_id` -> fluxo não duplica resposta.
3. `ai_paused=true` -> não chama IA e envia mensagem de handoff.
4. Intent “quero falar com humano” -> roteador determinístico aciona handoff.
5. Áudio válido -> transcreve -> segue pipeline textual.
6. Áudio inválido/grande -> fallback com erro controlado.

### Integração
1. Falha temporária no provedor WhatsApp -> retry com backoff -> sucesso.
2. Falha permanente -> marca `failed`, grava erro e não entra em loop infinito.
3. Supabase indisponível -> comportamento de degradação definido (fail-fast ou fila).

### Dados/consistência
1. `messages` respeita unique key de dedup.
2. `conversation_state` atualiza `last_inbound_at/last_outbound_at` corretamente.
3. Follow-up 24h/48h só dispara sem inbound novo após janela.

### Operacionais
1. Métrica de taxa de duplicados.
2. Métrica de taxa de handoff.
3. Tempo médio webhook -> sendText.
4. Custo por conversa (tokens + STT).
