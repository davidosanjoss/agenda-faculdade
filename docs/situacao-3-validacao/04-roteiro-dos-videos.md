# Roteiro dos vídeos

O material da disciplina pede dois vídeos:

1. **Vídeo da solução** (Situação 2): narrado, mostrando o sistema funcionando. O texto pede “no mínimo 5 minutos” em um trecho e “até 5 minutos” em outro, então mire em **cerca de 5 minutos**.
2. **Vídeo da solução atualizada** (Situação 3): até 5 minutos, mostrando as correções feitas após os testes.

Antes de gravar, entre com a conta de demonstração (dados de exemplo) e deixe uma segunda aba aberta no celular ou com o DevTools em modo celular.

## Vídeo 1: a solução (≈ 5 min)

| Tempo | Tela | O que falar |
|---|---|---|
| 0:00–0:30 | Slide ou README | Problema: MEIs de atendimento controlam a agenda no caderno e não sabem quanto vão faturar. Objetivo e ODS 8. |
| 0:30–1:00 | Login | Conta própria e dados isolados por profissional (RLS). |
| 1:00–2:00 | Agenda da semana | Resumo da semana, atendimentos sem baixa, mudar situação, lembrete pelo WhatsApp. **Agendar ao vivo** um cliente novo com um serviço do catálogo (valor automático) e mostrar o aviso de conflito. |
| 2:00–2:40 | Calendário do mês | Bolinhas por situação, clique e duplo clique num dia. |
| 2:40–3:40 | Financeiro | Previsão vs. realizado, a receber, perdido; comparação justa “até o mesmo dia”; gráfico de 6 meses; ranking de serviços. |
| 3:40–4:10 | Clientes e serviços | Busca por telefone, total gasto, faltas. |
| 4:10–4:40 | Celular | Mesma agenda no celular. |
| 4:40–5:30 | GitHub | Estrutura MVC (`src/lib` = model, `acoes.ts` = controller, telas = view), pasta `docs/`, **CI verde** com 98 testes automatizados. |

## Vídeo 2: solução atualizada (≤ 5 min)

| Tempo | O que mostrar |
|---|---|
| 0:00–0:30 | Quem testou (5 colegas) e como: formulário `/feedback` com prints. |
| 0:30–1:30 | Laudo de qualidade: problemas relatados, situação de cada um. |
| 1:30–4:00 | Para cada correção principal: o problema (print do testador), o commit no GitHub e o sistema já corrigido. |
| 4:00–5:00 | Sugestões que ficaram para uma próxima versão e por quê; CI verde após as correções. |
