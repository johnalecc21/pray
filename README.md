# 🙏 Pray

Full-stack mobile application built with **Expo React Native**, **Node.js/Express** backend, and **Supabase** as the database and auth provider.

## 📁 Project Structure

```
pray/
├── mobile/         # Expo React Native app (iOS & Android)
├── backend/        # Node.js + Express REST API
└── supabase/       # Database schema and migrations
```

## 🚀 Tech Stack

| Layer    | Technology                                 |
|----------|--------------------------------------------|
| Mobile   | Expo, React Native, NativeWind, Expo Router |
| Backend  | Node.js, Express, TypeScript, Zod           |
| Database | Supabase (PostgreSQL + Auth)                |
| Styling  | NativeWind (TailwindCSS for RN)             |

## ⚙️ Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- Expo CLI
- A Supabase project

### Backend

```bash
cd backend
cp .env.example .env    # fill in your Supabase credentials
npm install
npm run dev
```

### Mobile

```bash
cd mobile
cp .env.example .env    # fill in your API URL
npm install
npx expo start
```

### Database

Apply the schema to your Supabase project:

```bash
# Via Supabase dashboard SQL editor or CLI
psql -f supabase/schema.sql
```

## 🔐 Environment Variables

See `backend/.env.example` and `mobile/.env.example` for required variables.

> ⚠️ Never commit `.env` files with real credentials.

## 📄 License

MIT
