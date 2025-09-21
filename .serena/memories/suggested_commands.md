```bash
# install deps
cd inventorymanagement && npm install

# run dev server
npm run dev

# production build + start
npm run build && npm run start

# linting
npm run lint

# Supabase local dev
supabase start
supabase db reset      # reset + apply migrations
supabase migration new <name>
```