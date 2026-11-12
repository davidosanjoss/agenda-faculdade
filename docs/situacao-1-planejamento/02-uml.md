# Modelagem UML

Os diagramas usam [Mermaid](https://mermaid.js.org/), que o GitHub desenha automaticamente.

## Casos de uso

```mermaid
flowchart LR
  P(("👤 Profissional MEI"))
  T(("👤 Testador"))
  A(("👤 Administrador"))

  subgraph Sistema["Agenda MEI"]
    UC1([Criar conta / entrar])
    UC2([Agendar atendimento])
    UC3([Dar baixa: realizado / faltou / cancelado])
    UC4([Consultar agenda da semana])
    UC5([Consultar calendário do mês])
    UC6([Consultar financeiro])
    UC7([Gerenciar clientes])
    UC8([Gerenciar serviços])
    UC9([Enviar lembrete pelo WhatsApp])
    UC10([Enviar avaliação com prints])
    UC11([Registrar correção e imprimir laudo])
    UCx([Cadastrar cliente automaticamente])
    UCy([Avisar conflito de horário])
  end

  P --- UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7 & UC8 & UC9
  T --- UC1 & UC10
  A --- UC11
  UC2 -. include .-> UCx
  UC2 -. extend .-> UCy
```

## Diagrama de classes (domínio e persistência)

```mermaid
classDiagram
  direction LR
  class Usuario {
    +uuid id
    +string email
  }
  class Cliente {
    +uuid id
    +string nome
    +string? telefone
    +string? email
  }
  class Servico {
    +uuid id
    +string nome
    +decimal valor
  }
  class Agendamento {
    +uuid id
    +date data
    +time hora
    +string servico
    +decimal valor
    +Status status
    +string? obs
    +entraNaPrevisao() bool
    +precisaDeBaixa(hoje) bool
  }
  class Status {
    <<enumeration>>
    agendado
    realizado
    faltou
    cancelado
  }
  class Feedback {
    +uuid id
    +string testador
    +date dataTeste
    +string? funcionou
    +string? naoFuncionou
    +string? naoTestado
    +string? sugestoes
    +string[] prints
    +SituacaoFeedback situacao
    +string? correcao
  }
  class Administrador {
    +uuid userId
  }
  class Resumo {
    <<value object>>
    +decimal previsto
    +decimal realizado
    +decimal aReceber
    +decimal perdido
    +int atendimentos
    +decimal ticket
  }

  Usuario "1" --> "*" Cliente : possui
  Usuario "1" --> "*" Servico : oferece
  Usuario "1" --> "*" Agendamento : agenda
  Cliente "1" --> "*" Agendamento : é atendido em
  Agendamento --> Status
  Usuario "1" --> "*" Feedback : envia
  Usuario "1" --> "0..1" Administrador : pode ser
  Agendamento ..> Resumo : resumir()
```

## Sequência: salvar um agendamento

```mermaid
sequenceDiagram
  actor P as Profissional
  participant V as View<br/>(DialogoAgendamento)
  participant C as Controller<br/>(salvarAgendamento)
  participant M as Model<br/>(validacao.ts)
  participant DB as PostgreSQL<br/>(Supabase + RLS)

  P->>V: preenche cliente, serviço, valor
  V->>V: busca cliente/serviço conhecido<br/>e preenche contato e preço
  V->>V: avisa conflito de horário (se houver)
  P->>V: clica em Salvar
  V->>C: salvarAgendamento(dados)
  C->>M: validarAgendamento(dados)
  alt dados inválidos
    M-->>C: { ok: false, erro }
    C-->>V: erro
    V-->>P: mensagem de erro (formulário continua aberto)
  else dados válidos
    M-->>C: dados normalizados
    C->>DB: busca cliente pelo nome (ILIKE)
    alt cliente novo
      C->>DB: INSERT clientes
    else cliente existente
      C->>DB: UPDATE telefone/e-mail (se mudaram)
    end
    C->>DB: busca serviço; INSERT se for novo
    C->>DB: INSERT/UPDATE agendamentos
    DB-->>C: ok (RLS confere o dono)
    C->>C: revalidatePath("/")
    C-->>V: { ok: true }
    V-->>P: "Agendamento criado." e lista atualizada
  end
```

## Atividades: ciclo de um atendimento

```mermaid
flowchart TD
  I([Início]) --> A[Profissional agenda o atendimento]
  A --> B{Conflito de horário?}
  B -- sim --> B1[Sistema avisa] --> C
  B -- não --> C[Agendamento salvo como 'agendado']
  C --> D[Lembrete pelo WhatsApp - opcional]
  D --> E{Chegou o dia}
  E --> F{Cliente compareceu?}
  F -- sim --> G[Marca 'realizado'] --> R[Entra no realizado do financeiro]
  F -- não --> H[Marca 'faltou'] --> L[Entra no perdido]
  F -- desmarcou --> K[Marca 'cancelado'] --> L
  E -- dia passou sem baixa --> P[Sistema destaca 'sem baixa'] --> F
  R --> Fim([Fim])
  L --> Fim
```

## Estados de um agendamento

```mermaid
stateDiagram-v2
  [*] --> agendado
  agendado --> realizado
  agendado --> faltou
  agendado --> cancelado
  realizado --> agendado: correção
  faltou --> agendado: correção
  cancelado --> agendado: reagendado
  realizado --> [*]
  faltou --> [*]
  cancelado --> [*]
```
