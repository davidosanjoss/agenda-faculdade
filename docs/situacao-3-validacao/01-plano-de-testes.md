# Plano de testes: verificação e validação

- **Verificação** (“construímos o produto certo do jeito certo?”): revisão de código, lint, checagem de tipos e testes automatizados a cada push na CI.
- **Validação** (“construímos o produto certo?”): testes de aceitação com 5 usuários convidados, registrados pelo próprio sistema (`/feedback`) e consolidados no laudo.

## Casos de teste

Os casos marcados como **automatizado** rodam na CI a cada alteração. A coluna “Evidência” aponta o teste que comprova o resultado.

| ID | Requisito | Cenário | Resultado esperado | Tipo | Evidência | Situação |
|---|---|---|---|---|---|---|
| CT01 | RF01 | Acessar /financeiro sem login | Redireciona para /login | Sistema | e2e: *visitante sem login* | ✅ Passou |
| CT02 | RF01 | Entrar com senha errada | “E-mail ou senha incorretos.” | Sistema | e2e: *senha errada* | ✅ Passou |
| CT03 | RF01 | Criar conta nova | Entra na agenda | Sistema | e2e: *fluxo completo* | ✅ Passou |
| CT04 | RF02, RF03 | Agendar cliente que não existe | Agendamento, cliente e serviço criados | Integração + sistema | `acoes.test.ts`, e2e | ✅ Passou |
| CT05 | RF03 | Agendar “maria TESTE” já cadastrada como “Maria Teste” | Reaproveita o cliente, sem duplicar | Integração | `acoes.test.ts` | ✅ Passou |
| CT06 | RF03 | Digitar nome conhecido no formulário | Telefone e e-mail preenchidos | Unitário (tela) | `dialogo-agendamento.test.tsx` | ✅ Passou |
| CT07 | RF04 | Digitar serviço do catálogo | Valor preenchido (35,00) | Unitário (tela) | `dialogo-agendamento.test.tsx` | ✅ Passou |
| CT08 | RN06 | Valor “abc”, “-5” ou 1.000.000 | “Valor inválido.” e nada é gravado | Unitário + integração + sistema | `validacao.test.ts`, `acoes.test.ts`, e2e | ✅ Passou |
| CT09 | RNF05 | Data 30/02 | “Data ou hora inválida.” | Unitário + integração | `datas.test.ts`, `acoes.test.ts` | ✅ Passou |
| CT10 | RN07 | Telefone sem DDD | “Telefone inválido: informe DDD e número.” | Unitário | `validacao.test.ts` | ✅ Passou |
| CT11 | RF09, RN05 | Agendar no mesmo horário de outro atendimento | Aviso de conflito; ainda pode salvar | Unitário + sistema | `agenda-formato.test.ts`, e2e | ✅ Passou |
| CT12 | RF05 | Mudar situação para “realizado” | Valor passa para “já realizado” | Integração + sistema | `acoes.test.ts`, e2e | ✅ Passou |
| CT13 | RF10 | Atendimento de ontem ainda “agendado” | Destacado como sem baixa | Unitário | `agenda-formato.test.ts` | ✅ Passou |
| CT14 | RF11, RN01–RN03 | Mês com realizado, agendado, falta e cancelamento | Previsto, realizado, a receber, perdido e ticket corretos | Unitário | `financeiro.test.ts` | ✅ Passou |
| CT15 | RN04 | Realizado no meio do mês | Comparado ao mês anterior até o mesmo dia | Unitário | `financeiro.test.ts` | ✅ Passou |
| CT16 | RF08 | Calendário de nov/2026 (começa num domingo) | Grade de 6 semanas, de 26/10 a 06/12 | Unitário + sistema | `datas.test.ts`, e2e | ✅ Passou |
| CT17 | RNF04 | Servidor em UTC às 01:30 do dia 13 | “Hoje” é dia 12 (São Paulo) | Unitário | `datas.test.ts` | ✅ Passou |
| CT18 | RN08 | Excluir cliente com agendamentos | Mensagem explicando e cliente mantido | Integração | `acoes.test.ts` | ✅ Passou |
| CT19 | RF14 | Buscar cliente por “98888” | Encontra pelo telefone | Unitário (tela) | `telas.test.tsx` | ✅ Passou |
| CT20 | RNF01 | Usuário B tenta ler, alterar e excluir dados de A | Nada é visto nem alterado | Integração | `seguranca.test.ts` | ✅ Passou |
| CT21 | RNF01 | Usuário B agenda usando o cliente de A | Recusado pelo banco | Integração | `seguranca.test.ts` | ✅ Passou |
| CT22 | RF17 | Enviar avaliação com print | “Avaliação enviada. Muito obrigado!” | Integração + sistema | `feedback.test.ts`, e2e | ✅ Passou |
| CT23 | RF17 | Print em PDF ou maior que 5 MB | Mensagem de tipo ou tamanho; Storage também recusa | Unitário + integração | `feedback.test.ts` | ✅ Passou |
| CT24 | RF18 | Testador tenta marcar a própria avaliação como corrigida | “Apenas o administrador pode registrar correções.” | Integração | `feedback.test.ts` | ✅ Passou |
| CT25 | RF18 | Administrador registra correção | Situação e texto gravados; aparecem no laudo | Integração | `feedback.test.ts` | ✅ Passou |
| CT26 | RNF03 | Endereço inexistente | Tela 404 com link para a agenda | Sistema | e2e: *404* | ✅ Passou |
| CT27 | RNF02 | Uso em tela de 390 px | Calendário compacto, valores visíveis, menu cabe | Inspeção visual | capturas 10 e 11 | ✅ Passou |
| CT28 | Todos | Uso real por 5 testadores | Ver laudo | Aceitação | [03-laudo-de-qualidade.md](03-laudo-de-qualidade.md) | ⏳ A realizar |
