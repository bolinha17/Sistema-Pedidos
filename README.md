# Mini Checkout — Sistema de Pedidos

> **Trabalho prático** – Qualidade de Software  
> Node.js + Express + SQLite

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 
- npm

### Instalação e execução

```bash
# 1. Entrar na pasta do projeto
cd "Trabalho Qualidade de Software"

# 2. Instalar dependências (se ainda não instalou)
npm install

# 3. Iniciar o servidor
npm start
```

O servidor roda em **http://localhost:3000**  
A interface web está disponível automaticamente em `http://localhost:3000`.

### Rodar os testes

```bash
npm test
```

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/produtos` | Cadastra um produto |
| `GET` | `/produtos` | Lista todos os produtos |
| `POST` | `/pedidos` | Cria um pedido (status: ABERTO) |
| `POST` | `/pedidos/:id/itens` | Adiciona item ao pedido |
| `POST` | `/pedidos/:id/finalizar` | Finaliza o pedido |
| `GET` | `/pedidos` | Lista pedidos com total |
| `GET` | `/metricas` | Mostra métricas de tempo/erros |

### Exemplos de requisição

#### Criar produto
```json
POST /produtos
{ "nome": "Caneca", "preco": 15.50 }
```

#### Adicionar item
```json
POST /pedidos/1/itens
{ "produto_id": 1, "quantidade": 3 }
```

---

## 🗂️ Estrutura do projeto

```
├── server.js              # Entrada do servidor
├── public/
│   └── index.html         # Interface web
├── src/
│   ├── app.js             # Configuração Express
│   ├── database.js        # Conexão SQLite
│   ├── controllers/       # Camada HTTP
│   │   ├── produtoController.js
│   │   └── pedidoController.js
│   ├── services/          # Regras de negócio
│   │   ├── produtoService.js
│   │   └── pedidoService.js
│   ├── routes/            # Rotas Express
│   │   ├── produtos.js
│   │   └── pedidos.js
│   └── middleware/
│       └── metrics.js     # Observabilidade
├── tests/
│   └── api.test.js        # Testes Jest + Supertest
└── data/
    └── loja.db            # Banco SQLite (criado automaticamente)
```

---

## 📋 Respostas padronizadas

Todas as respostas seguem o formato:

```json
{ "sucesso": true, "data": { ... } }
// ou em caso de erro:
{ "sucesso": false, "erro": "mensagem descritiva" }
```
