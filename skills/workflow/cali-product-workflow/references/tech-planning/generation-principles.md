# Tech Planning — Generation Principles

When generating code, plans, architecture, or any final product output, follow these principles in priority order.

---

## Princípios de Design de Código (aplicam-se a TODO código gerado)

### 1. KISS — simplest solution that works correctly
- Nenhuma função > 50 linhas (se precisar, extraia sub-funções)
- Nenhum arquivo > 400 linhas (se precisar, divida em módulos)
- Complexidade ciclomática por função < 10
- Evite aninhamento profundo (max 3 níveis de indentação)

### 2. DRY — eliminate duplication
- Duplicação de lógica = extrair função compartilhada
- Duplicação de configuração = centralizar em constante/var
- Duplicação de template = criar partial/componente
- Duplicação > 5% do arquivo é sinal de alerta

### 3. Convention over Configuration
- Sensible defaults, nomes padronizados, estrutura de diretórios previsível
- Configuração explícita apenas quando desviar da convenção

### 4. Progressive Disclosure
- Simples por padrão, complexidade atrás de toggles
- Essencial primeiro, avançado depois

### 5. Polymorphism when useful
- Interfaces para extensibilidade apenas quando agrega valor real
- Prefira tipos concretos a abstrações prematuras

---

## Princípios de Arquitetura Frontend

### 6. Datastar: princípios do framework

Quando o projeto usa **Datastar** (detectado por import Datastar, uso de `data-*` attributes, ou Go + Templ + Datastar), siga os princípios do framework definidos pelo seu criador:

#### 6a. Backend é a fonte da verdade para estado
- Estado de domínio vive no backend, nunca em signals ou stores no frontend
- Signals no frontend são apenas para UI efêmera (toggle aberto/fechado, validação local, animação)
- Toda decisão de negócio é validada no servidor — o frontend não confia em si mesmo

#### 6b. SSE-first como mecanismo de comunicação
- Use `datastar-patch-elements` via SSE para atualizações do backend
- SSE é mais simples que WebSockets, tem reconexão automática do browser, e é mais eficiente que polling
- WebSockets só quando houver necessidade real de comunicação bidirecional (chat, colaboração)

#### 6c. HATEOAS como princípio arquitetural
- O backend determina quais ações o usuário pode tomar — links e formulários são descobertos via hipertexto
- Ações disparam requests, backend responde com HTML, Datastar morpha no DOM
- Frontend é um terminal burro e reativo — mínimo de lógica possível no cliente

#### 6d. Locality of Behavior (LoB) para o frontend Datastar
- Comportamento (atributos `data-*`) no MESMO componente HTML que o usa
- Zero JavaScript customizado: use os atributos nativos do Datastar (`@get`, `@post`, `data-on`, `data-bind`, `data-signal`, etc.)
- JS inline só quando Datastar não oferecer o comportamento nativo

Referência: [data-star.dev/guide](https://data-star.dev/guide) | [data-star.dev/essays/why_another_framework](https://data-star.dev/essays/why_another_framework)

### 7. Separation of Concerns (SoC)

Aplica-se a **TODO código que não é frontend Datastar**, incluindo:
- **Backend do próprio projeto Datastar** (Go handlers, serviços, repositórios, banco)
- **Projetos sem Datastar** (React, Vue, Svelte, Angular, HTML puro + JS)
- **APIs, lógica de negócio, camada de dados** — independente do framework frontend

- **Separe responsabilidades:** template, lógica, dados, e estilo em camadas distintas
- **Componente/camada faz uma coisa só:** handler não deve chamar banco direto; serviço não deve renderizar HTML
- **Lógica de negócio fora do template:** extraia para serviços, repositórios, helpers
- **Nem toda função precisa estar no componente:** código reutilizável vive em módulos separados

### 8. Regra de desempate

| O quê | Princípio |
|---|---|
| Frontend **Datastar** (atributos `data-*`) | ✅ **LoB** — comportamento no HTML que o usa |
| Backend de projeto Datastar (Go, handlers, serviços) | ✅ **SoC** — separação em camadas |
| Projeto **sem Datastar** (React, Vue, etc.) | ✅ **SoC** — tudo em camadas separadas |
| Mix Datastar + outro framework | ⚠️ LoB no frontend Datastar, SoC no resto |
| Dúvida | **SoC** é o safe default |

---

## Quando em dúvida

Simplest, most conventional path. Se LoB e SoC conflitarem, o contexto do framework decide.
