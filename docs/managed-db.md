# Managed database setup

## Supabase / Neon
1. Create a PostgreSQL database in Supabase or Neon.
2. Copy the connection string.
3. Set the environment variable:
   - MANAGED_DATABASE_URL=postgresql://...
4. Run the migrations:
   - npm run migrate:db
5. Seed initial sample users:
   - npm run seed:db

## Vercel
Set these secrets in Vercel Project Settings:
- MANAGED_DATABASE_URL

## Render
Set this environment variable in Render service settings:
- MANAGED_DATABASE_URL
