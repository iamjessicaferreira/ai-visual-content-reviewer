# Guia de Push para GitHub

## Opção 1: GitHub Desktop (Recomendado - Mais Fácil)

### Passo 1: Instalar GitHub Desktop (se não tiver)
- Baixe em: https://desktop.github.com/
- Faça login com sua conta GitHub

### Passo 2: Adicionar o Repositório
1. Abra o GitHub Desktop
2. Clique em **File → Add Local Repository**
3. Navegue até: `/Users/jessicaferreira/Documents/vestov/vpl-project`
4. Clique em **Add Repository**

### Passo 3: Fazer o Commit Inicial
1. No GitHub Desktop, você verá todos os arquivos não commitados
2. Na parte inferior, escreva a mensagem: `Initial commit: AI Visual Content Reviewer MVP`
3. Clique em **Commit to main**

### Passo 4: Publicar no GitHub
1. Clique no botão **Publish repository** (ou **Push origin** se já tiver remote)
2. Escolha o nome do repositório (ex: `ai-visual-content-reviewer`)
3. Escolha se será público ou privado
4. Clique em **Publish Repository**

Pronto! Seu código estará no GitHub! 🎉

---

## Opção 2: Interface Web do GitHub

### Passo 1: Criar Repositório no GitHub
1. Acesse: https://github.com/new
2. Nome do repositório: `ai-visual-content-reviewer` (ou o nome que preferir)
3. Escolha se será público ou privado
4. **NÃO** marque "Initialize with README" (já temos um)
5. Clique em **Create repository**

### Passo 2: No Terminal do Cursor
Execute estes comandos no terminal do Cursor:

```bash
# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Initial commit: AI Visual Content Reviewer MVP"

# Adicionar o remote do GitHub (substitua SEU_USUARIO pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/ai-visual-content-reviewer.git

# Fazer push
git branch -M main
git push -u origin main
```

**Nota**: Se pedir credenciais, você pode:
- Usar um Personal Access Token (Settings → Developer settings → Personal access tokens)
- Ou usar GitHub Desktop para fazer o push

---

## Opção 3: GitHub CLI (se tiver instalado)

```bash
# Fazer commit
git add .
git commit -m "Initial commit: AI Visual Content Reviewer MVP"

# Criar repositório e fazer push (substitua pelo nome desejado)
gh repo create ai-visual-content-reviewer --public --source=. --remote=origin --push
```

---

## Arquivos que serão enviados

✅ Todos os arquivos do projeto
✅ README.md atualizado
✅ .env.example (template de variáveis)
✅ .gitignore (configurado corretamente)
✅ Código fonte completo

❌ **NÃO serão enviados** (por causa do .gitignore):
- node_modules/
- .env (arquivo local com suas chaves)
- .next/ (build files)
- Arquivos temporários

---

## Depois do Push

1. Verifique se todos os arquivos estão no GitHub
2. Copie a URL do repositório
3. Use essa URL para fazer deploy na Vercel (conforme DEPLOYMENT.md)

---

## Problemas Comuns

**"Permission denied" ao fazer push:**
- Use GitHub Desktop (mais fácil)
- Ou configure SSH keys no GitHub
- Ou use Personal Access Token

**"Repository not found":**
- Verifique se o nome do repositório está correto
- Verifique se você tem permissão no repositório

**Arquivos não aparecem:**
- Verifique se fez `git add .` antes do commit
- Verifique o .gitignore não está bloqueando arquivos importantes
