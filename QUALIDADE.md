# Documento de Qualidade — Mini Checkout

**Projeto:** Mini Sistema de Pedidos (e-commerce)  
**Tecnologia:** Node.js + Express + SQLite  
**Data:** 2026-03-19

---

## Critérios de Qualidade Verificados

### 1. Funcionalidade Correta — Cálculo do Total
**Critério:** O total do pedido deve ser igual à soma de (preço × quantidade) para todos os itens.  
**Como verifiquei:** Teste automatizado Jest: produto com preço R$ 15,50, quantidade 3 → total esperado R$ 46,50. Resultado comparado com `toBeCloseTo(46.5, 2)`.  
**Evidência:** Teste `total do pedido é calculado corretamente` — PASSED.

---

### 2. Validação de Entrada — Quantidade
**Critério:** Quantidade igual a 0 ou negativa deve ser rejeitada com status HTTP 400.  
**Como verifiquei:** Teste automatizado: enviado `quantidade: 0` e `quantidade: -5` via Supertest. Ambos retornam status 400 e `sucesso: false`.  
**Evidência:** Teste `quantidade inválida (0 ou negativa) deve retornar 400` — PASSED.

---

### 3. Validação de Entrada — Preço
**Critério:** Preço negativo ao criar produto deve ser rejeitado com status 400.  
**Como verifiquei:** Teste automatizado: enviado `{ "preco": -5 }`. Resposta esperada: status 400, campo `erro` contendo "negativo".  
**Evidência:** Teste `criar produto com preço negativo deve retornar 400` — PASSED.

---

### 4. Mensagens Claras de Erro
**Critério:** Toda resposta de erro deve ter formato padronizado `{ "sucesso": false, "erro": "..." }` e mensagem descritiva em português.  
**Como verifiquei:** Inspecionado manualmente e via testes automatizados com `expect(res.body.sucesso).toBe(false)` e `expect(res.body.erro).toMatch(regex)`.  
**Evidência:** Todos os 8 testes conferem o formato da resposta. Mensagens como "Não é possível adicionar itens a um pedido finalizado." aparecem nos logs.

---

### 5. Regra de Negócio — Pedido Finalizado
**Critério:** Um pedido com status FINALIZADO não pode receber novos itens.  
**Como verifiquei:** Teste automatizado: criado pedido, adicionado item, finalizado. Tentativa de adicionar novo item retorna 400 com mensagem contendo "finalizado".  
**Evidência:** Teste `pedido finalizado não pode receber novos itens` — PASSED.

---

### 6. Confiabilidade — Chamadas Repetidas
**Critério:** `GET /pedidos` pode ser chamado 20 vezes consecutivas sem erro.  
**Como verifiquei:** Teste automatizado com laço de 20 iterações via Supertest. Cada iteração verifica status 200 e `sucesso: true`.  
**Evidência:** Teste `GET /pedidos pode ser chamado 20 vezes sem erro` — PASSED.

---

### 7. Desempenho — Tempo de Resposta
**Critério:** `GET /pedidos` deve responder em até 300ms (média local).  
**Como verifiquei:** Middleware de métricas (`src/middleware/metrics.js`) registra o tempo de cada requisição em ms no console. Rota `GET /metricas` expõe a média calculada (totalMs / count).  
**Evidência:** Console exibe linhas como `GET /pedidos → 200 (4ms)`. Rota `/metricas` retorna `"media_ms": 5` em execuções locais — muito abaixo dos 300ms exigidos.

---

### 8. Segurança Mínima — Dados Malformados
**Critério:** O sistema não deve aceitar payload inválido nem vazar stack traces nos logs de produção.  
**Como verifiquei:** Envio de `produto_id: 999999` retorna 404 limpo sem detalhes internos. O global error handler captura exceções inesperadas e retorna apenas "Erro interno do servidor." — sem stacktrace na resposta HTTP. Logs usam `console.error('[ERRO]', err.message)` (só mensagem, sem stack).  
**Evidência:** Teste `adicionar item com produto inexistente deve retornar 404` — PASSED. Resposta não contém `stack` nem caminhos internos.

---

### 9. Observabilidade — Métricas por Rota
**Critério:** O sistema deve registrar tempo de resposta e contagem de erros por rota.  
**Como verifiquei:** Middleware `metricsMiddleware` (em `src/middleware/metrics.js`) registra `count`, `totalMs` e `erros` por rota. Rota `GET /metricas` retorna o relatório completo em JSON.  
**Evidência:**
```json
{
  "GET /pedidos": { "requisicoes": 5, "media_ms": 4, "erros": 0 },
  "POST /produtos": { "requisicoes": 3, "media_ms": 7, "erros": 0 }
}
```

---

### 10. Manutenibilidade — Separação de Responsabilidades
**Critério:** Código organizado em camadas distintas: routes → controllers → services → database.  
**Como verifiquei:** Verificado na estrutura do projeto: cada arquivo tem responsabilidade única. Controllers tratam HTTP, Services contêm regras de negócio, Database gerencia somente a conexão SQLite.  
**Evidência:** Estrutura: `routes/`, `controllers/`, `services/`, `middleware/`, `database.js` — cada módulo com máximo ~80 linhas.

---

## Resumo dos Testes Automatizados

| # | Teste | Categoria | Resultado |
|---|-------|-----------|-----------|
| 1 | Total calculado corretamente | Regra de negócio | ✅ PASS |
| 2 | Quantidade 0 ou negativa rejeitada | Validação | ✅ PASS |
| 3 | Pedido finalizado não aceita itens | Regra de negócio | ✅ PASS |
| 4 | POST /pedidos cria pedido ABERTO | API | ✅ PASS |
| 5 | POST /pedidos/:id/finalizar muda status | API | ✅ PASS |
| 6 | Produto inexistente retorna 404 | Erro | ✅ PASS |
| 7 | Preço negativo retorna 400 | Validação | ✅ PASS |
| 8 | GET /pedidos 20 chamadas sem erro | Confiabilidade | ✅ PASS |

**Total: 8 testes — 8 PASSED, 0 FAILED**
