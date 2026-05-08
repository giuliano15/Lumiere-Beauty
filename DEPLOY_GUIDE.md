# 🚀 Guia de Deploy — Lumiere Beauty (Monorepo)

> **Referência para IAs e desenvolvedores** sobre como funciona o fluxo de publicação deste projeto.

---

## 📁 Estrutura do Repositório

```
projetos/                          ← Raiz do monorepo (1 único repositório Git)
├── admin-api/                     ← Backend Node.js/Express/Prisma
├── admin-web/                     ← Painel administrativo React/Vite
└── loja-premium-maquiagem/        ← Vitrine (HTML/CSS/JS puro, site estático)
```

---

## ⚙️ Como o Deploy Funciona

### Fluxo completo:
```
Edição local → git add + commit + push → GitHub → Vercel (automático)
```

### Regra de ouro:
> **Qualquer `git push origin main` dispara automaticamente um novo deploy no Vercel para os projetos conectados.**

---

## 🔗 Projetos no Vercel

O Vercel está conectado ao repositório GitHub: `giuliano15/Lumiere-Beauty`

| Projeto Vercel | Pasta no Repo | URL de Produção |
|---|---|---|
| `lumiere-admin-web` | `admin-web/` | `lumiere-admin-web.vercel.app` |
| `lumiere-loja-premium-maquiagem` | `loja-premium-maquiagem/` | `lumiere-loja-premium-maquiagem.vercel.app` |
| `lumiere-api` | `admin-api/` | `lumiere-api-swart.vercel.app` |

Cada projeto Vercel tem seu **Root Directory** configurado apontando para a subpasta correspondente.

---

## ✅ Como Subir Alterações Corretamente

### Para qualquer subprojeto:
```bash
# Na raiz do monorepo (c:\Users\dev01_atendio\apps estudo\projetos)
git add .
git commit -m "tipo: descrição clara do que foi feito"
git push origin main
```

O Vercel detecta automaticamente qual subpasta mudou e faz o deploy do projeto correspondente.

---

## ⚠️ Regras Importantes — NUNCA FAÇA ISSO

### ❌ NÃO adicione `vercel.json` na pasta da loja
A loja (`loja-premium-maquiagem/`) é um **site estático puro**. O Vercel já sabe como publicar arquivos HTML/CSS/JS automaticamente. Adicionar um `vercel.json` manual **quebra o processo automático**.

### ❌ NÃO use `--force` no git push desnecessariamente
O `git push origin main --force` pode criar problemas de histórico.

### ❌ NÃO crie arquivos `.txt` na raiz do projeto
O `.gitignore` está configurado para ignorar `*.txt`, então esses arquivos nunca serão enviados ao GitHub.

---

## 🕐 Tempo de Deploy

| Ação | Tempo estimado |
|---|---|
| `git push` até Vercel iniciar build | 10–30 segundos |
| Build da loja (estático) | 5–15 segundos |
| Build do admin-web (React/Vite) | 30–90 segundos |
| Propagação de CDN (cache) | 1–3 minutos |

---

## 🔍 Como Verificar se o Deploy Funcionou

1. Acesse o painel Vercel: `https://vercel.com/giuliano-rodrigues-projects-1505a3c5`
2. O commit mais recente deve aparecer no topo da lista de **Deployments**
3. Status **verde (Ready)** = publicado com sucesso
4. Status **vermelho (Error)** = verificar logs de build

---

## 🛠️ Depuração — Se o Site Não Atualizar

### Passo 1: Verificar se o push chegou ao GitHub
```bash
git log --oneline -5
```
O commit mais recente deve estar listado.

### Passo 2: Verificar no Vercel
- Abrir o projeto específico (loja ou admin-web)
- Ver se o commit aparece na aba **Deployments**
- Se não aparecer, o webhook pode estar com problema

### Passo 3: Forçar redeploy manual
- No Vercel → Deployments → três pontinhos `...` → **Redeploy**
- Isso força o Vercel a ler o estado mais recente do GitHub

### Passo 4: Cache do navegador
- **Ctrl + F5** (Windows) para ignorar cache local
- Ou abrir em **aba anônima** para testar sem cache

---

## 🌐 URLs Úteis

| Recurso | URL |
|---|---|
| Repositório GitHub | `https://github.com/giuliano15/Lumiere-Beauty` |
| Painel Vercel | `https://vercel.com/giuliano-rodrigues-projects-1505a3c5` |
| API de produção | `https://lumiere-api-swart.vercel.app` |
| Loja (produção) | `https://lumiere-loja-premium-maquiagem.vercel.app` |
| Admin Web (produção) | `https://lumiere-admin-web.vercel.app` |

---

## 📡 Ambiente Local

### Loja (estático):
```bash
cd loja-premium-maquiagem
npx serve . -p 3000
# Acesse: http://localhost:3000
```

### Admin Web (React):
```bash
cd admin-web
npm run dev
# Acesse: http://localhost:5173
```

### API (Node.js):
```bash
cd admin-api
npm run dev
# Acesse: http://localhost:3001
```

---

*Documento criado em 08/05/2026. Atualizar sempre que houver mudanças na arquitetura de deploy.*
