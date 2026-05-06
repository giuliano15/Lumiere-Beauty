# Admin API

## 1) Instalar dependencias

```bash
npm install
```

## 2) Configurar ambiente

Copie `.env.example` para `.env` e ajuste:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`

## 3) Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
```

## 4) Rodar API

```bash
npm run dev
```

## Upload otimizado de imagens

- Endpoint: `POST /admin/upload` (autenticado)
- Campo multipart: `files`
- Otimizacao automatica:
  - redimensiona para no maximo 1600x1600
  - converte para WebP
  - qualidade 78 (balanceando peso e qualidade)
- Arquivos servidos em: `/uploads/*`

## Login inicial seed

- email: `admin@lumiere.com`
- senha: `admin123`

