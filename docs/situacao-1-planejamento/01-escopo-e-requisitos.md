# Escopo e requisitos

## Problema

Profissionais autônomos de atendimento (manicures, cabeleireiros, fisioterapeutas, esteticistas), em geral registrados como MEI, costumam controlar horários em caderno ou no WhatsApp e não sabem **quanto vão receber no mês** nem se estão **faturando mais ou menos que nos meses anteriores**. Faltas de clientes não são registradas e o dinheiro perdido passa despercebido.

## Objetivo

Oferecer um sistema web gratuito, simples e acessível pelo celular para:

1. registrar os atendimentos (cliente, contato, serviço e valor);
2. acompanhar a agenda da semana e do mês;
3. mostrar a **previsão de faturamento** do mês e a **comparação com meses anteriores**.

## Público-alvo e partes interessadas

| Parte interessada | Interesse |
|---|---|
| Profissional MEI (usuário principal) | Organizar a agenda e enxergar o faturamento sem planilhas |
| Clientes do profissional | Receber lembrete do horário (WhatsApp) e menos remarcações |
| Testadores (colegas de curso) | Validar o sistema e relatar problemas (Situação 3) |
| Desenvolvedor (administrador) | Acompanhar avaliações e registrar correções |

Relação com a extensão universitária: **ODS 8 – Trabalho decente e crescimento econômico**, meta **8.3** (fortalecer micro e pequenos empreendedores).

## Requisitos funcionais

| ID | Requisito | Prioridade |
|---|---|---|
| RF01 | Criar conta e entrar com e-mail e senha; sair do sistema | Alta |
| RF02 | Cadastrar agendamento com data, hora, cliente, telefone, e-mail (opcional), serviço, valor, situação e observação | Alta |
| RF03 | Reaproveitar cliente já cadastrado pelo nome (sem diferenciar maiúsculas) e cadastrar automaticamente cliente novo | Alta |
| RF04 | Sugerir o valor a partir do catálogo de serviços e cadastrar automaticamente serviço novo | Média |
| RF05 | Alterar a situação do atendimento: agendado, realizado, faltou, cancelado | Alta |
| RF06 | Editar e excluir agendamento | Alta |
| RF07 | Visualizar a agenda da semana (lista por dia) | Alta |
| RF08 | Visualizar a agenda do mês (calendário), com detalhes do dia selecionado | Média |
| RF09 | Avisar conflito de horário com outro agendamento ativo | Média |
| RF10 | Destacar atendimentos passados que continuam “agendado” (sem baixa) | Média |
| RF11 | Mostrar no financeiro: previsão do mês, realizado, a receber, perdido, atendimentos e ticket médio | Alta |
| RF12 | Comparar com o mês anterior e mostrar os últimos 6 meses em gráfico e tabela | Alta |
| RF13 | Ranking de serviços do mês | Baixa |
| RF14 | Listar clientes com busca por nome/telefone, total gasto, atendimentos, faltas e último atendimento | Média |
| RF15 | Cadastrar, editar e excluir clientes e serviços | Média |
| RF16 | Abrir conversa no WhatsApp com mensagem de lembrete pronta | Baixa |
| RF17 | Testador envia avaliação (o que funcionou, o que não funcionou, o que não testou, sugestões) com até 5 prints | Alta (PIT) |
| RF18 | Administrador consulta todas as avaliações, registra a correção e imprime o laudo de qualidade em PDF | Alta (PIT) |

## Requisitos não funcionais

| ID | Requisito | Como é atendido |
|---|---|---|
| RNF01 | Privacidade: cada profissional só acessa os próprios dados | Row Level Security no PostgreSQL; testado em `tests/integracao/seguranca.test.ts` |
| RNF02 | Usabilidade no celular (largura a partir de 360 px) | Layout responsivo; calendário compacto no celular (capturas 10 e 11) |
| RNF03 | Mensagens de erro claras, em português, sem termos técnicos | Catálogo em [03-ihc.md](03-ihc.md) |
| RNF04 | Datas corretas no fuso de São Paulo, mesmo com servidor em UTC | `src/lib/datas.ts` + teste com relógio simulado |
| RNF05 | Integridade dos dados | Validação no servidor + restrições `CHECK`, `NOT NULL` e chaves estrangeiras no banco |
| RNF06 | Disponibilidade sem custo | Vercel (hospedagem) e Supabase (banco) nos planos gratuitos |
| RNF07 | Manutenibilidade | Camadas MVC, TypeScript estrito, lint e testes automatizados na CI |
| RNF08 | Senhas nunca armazenadas pelo sistema | Autenticação delegada ao Supabase Auth (hash bcrypt) |

## Regras de negócio

| ID | Regra |
|---|---|
| RN01 | Entram na **previsão** os atendimentos *agendados* e *realizados*; *faltou* e *cancelado* contam como **perdido**. |
| RN02 | **A receber** = soma dos atendimentos ainda *agendados* no mês. |
| RN03 | **Ticket médio** = total realizado ÷ quantidade de atendimentos realizados. |
| RN04 | No mês corrente, o **realizado** é comparado com o realizado do mês anterior **até o mesmo dia** (comparar meio mês com o mês inteiro sempre indicaria queda). |
| RN05 | Conflito de horário: mesmo dia e hora de outro agendamento que não esteja cancelado (é um aviso, não um bloqueio — o profissional pode atender duas pessoas). |
| RN06 | Valor entre R$ 0,00 e R$ 999.999,99; aceita vírgula decimal (“35,50”). |
| RN07 | Telefone opcional; se informado, deve ter DDD (10 a 13 dígitos). |
| RN08 | Cliente com agendamentos não pode ser excluído (preserva o histórico financeiro). |
| RN09 | Excluir um serviço do catálogo não altera agendamentos antigos (o nome do serviço é gravado no agendamento). |

## Fora do escopo (versão atual)

Agendamento online pelo próprio cliente, emissão de nota fiscal, pagamentos online, controle de estoque e múltiplos profissionais na mesma conta.
