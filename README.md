# Cubo Glass — Controle de Margem v2

## Nova lógica
Não existe mais lançamento de vendas.

O sistema funciona assim:
**Cliente → faturamento médio mensal (peso) → tabela → margem → margem total da carteira.**

Meta padrão: **42,24%**.

O faturamento médio mensal NÃO é uma venda. É uma estimativa usada somente para dar peso ao cliente no cálculo da carteira.

## Firebase
1. Crie um projeto no Firebase.
2. Ative o Firestore Database.
3. Configurações do projeto → Seus aplicativos → Web.
4. Copie o `firebaseConfig`.
5. Abra `app.js`.
6. Cole os dados no bloco `const firebaseConfig`.
7. A linha `apiKey: "COLE_SUA_API_KEY_AQUI"` é o local indicado para sua API Key.

Coleções utilizadas: `clientes`, `produtos`, `tabelas_preco`.

## GitHub Pages
Envie os arquivos extraídos (`index.html`, `style.css`, `app.js`, `firestore.rules`, `README.md`) para a raiz do repositório. Não envie somente o ZIP.
Depois: Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

## Segurança
A API Key web do Firebase não é uma senha. A proteção dos dados depende das regras do Firestore e da autenticação. As regras incluídas estão abertas apenas para teste e NÃO devem permanecer assim em produção.
