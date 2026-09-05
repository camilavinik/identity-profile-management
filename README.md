# nomina

A Context-Aware REST API for Personal Identity Management

## Live

- **App:** https://identity-profile-management.vercel.app
- **API documentation:** https://identity-profile-management.onrender.com/docs

## Structure

This is a monorepo:

```
backend/    NestJS API, Prisma schema and migrations
frontend/   React single-page app
```

## Running locally

Requires Node.js and a PostgreSQL database.

**Backend**

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Tests

```bash
cd backend && npm test
cd frontend && npm run test:run
```

## About

Final project for University of London CM3070, based on Template 7.1: Identity and Profile Management API.
