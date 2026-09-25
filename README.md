# Cubo Glass — Controle de Margem

Sistema HTML + JavaScript + Firebase Firestore para controlar:
- clientes
- produtos e custos
- preços negociados por cliente
- vendas
- margem por venda
- margem por cliente
- margem ponderada da carteira
- dashboard
- simulador de negociação
- filtros
- exclusão/edição
- exportação CSV

## 1. Firebase

1. Crie um projeto no Firebase.
2. Crie um banco Firestore.
3. Em Configurações do projeto > Seus apps, crie um app Web.
4. Copie o objeto `firebaseConfig`.
5. Abra `app.js`.
6. Substitua o objeto `firebaseConfig` pelos dados do seu projeto.

A linha da API key está marcada no código:

`apiKey: "COLE_SUA_API_KEY_AQUI"`

A API key do Firebase Web é identificador do projeto, não uma senha. A proteção real dos dados deve ser feita com Firebase Authentication + Firestore Security Rules.

## 2. Teste

Você pode usar VS Code + extensão Live Server, ou publicar os arquivos em GitHub Pages.

Não abra o HTML diretamente como `file://`, pois módulos ES e algumas funções do navegador podem bloquear o carregamento.

## 3. Firestore

O sistema cria automaticamente estas coleções quando você salvar o primeiro registro:

- clientes
- produtos
- precos
- vendas

## 4. Segurança

O arquivo `firestore.rules` está propositalmente permissivo para teste inicial.

NÃO use `allow read, write: if true` em produção.

Para produção, recomendo:
- Firebase Authentication
- usuário administrador
- regras Firestore por usuário/perfil
- validação dos dados
- histórico de alterações

## 5. Observação sobre margem

A margem da carteira é calculada como:

(faturamento total - custo total) / faturamento total

Ou seja, a meta de 42,24% é da carteira como conjunto. Um cliente pode ficar abaixo ou acima da meta sem problema; o dashboard mostra o efeito dele no resultado geral.
