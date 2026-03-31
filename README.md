# CRM Backend — Node.js + MySQL

## Setup

```bash
cd crm_backend
npm install
```

Update `server.js` DB config:
```js
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'YOUR_PASSWORD',  // ← change
  database: 'crm_db',         // ← change (create this DB first)
};
```

Create DB and run seed:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS crm_db;"
mysql -u root -p crm_db < seed.sql
```

Start server:
```bash
npm start
# or for dev with auto-reload:
npm run dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/users | Get all active users (for dropdown) |
| GET | /api/leads | Get all leads (with all fields) |
| POST | /api/leads | Create lead |
| PUT | /api/leads/:id | Update lead |
| DELETE | /api/leads/:id | Delete lead |

## Flutter Emulator URL
- Android emulator: `http://10.0.2.2:5000/api`
- iOS simulator / real device: `http://YOUR_LOCAL_IP:5000/api`

Change `baseUrl` in `lib/services/api_service.dart` accordingly.
