# 🎡 Production Discount Spinner Wheel

A premium, secure, and responsive promotional discount wheel designed for e-commerce conversion.

## 🚀 Features
- **Backend-Driven Logic**: Prizes are determined by the server, making it impossible to cheat via frontend manipulation.
- **Weighted Probabilities**: Business owners can control the distribution of prizes.
- **Fraud Prevention**: One-spin-per-user rule enforced via server-side session tracking (SQLite).
- **Premium UI**: High-contrast, modern design with smooth CSS easing and canvas rendering.
- **Unique Coupons**: Generates unique alphanumeric coupon codes for winners.

---

## 🛠️ Local Setup Instructions

### 1. Prerequisites
- Install [Node.js](https://nodejs.org/) (v16+ recommended).

### 2. Backend Installation
```bash
cd discount-wheel/backend
npm install
npm start
```
The server will start on `http://localhost:3000`.

### 3. Frontend Setup
Since this is a vanilla JS/HTML project, you can simply open `discount-wheel/frontend/index.html` in your browser. 
*Note: For the best experience and to avoid CORS issues in some browsers, serve the frontend folder using a simple server like `live-server` or `http-server`.*

---

## ⚙️ Business Configuration

All business logic is located in `discount-wheel/backend/config.js`.

### Changing Prize Probabilities
Find the `PRIZES` array. Each object has a `weight`.
- **Example**: To increase the chance of 50% OFF, increase its weight (e.g., from `2` to `5`) and decrease another (e.g., 10% OFF from `45` to `40`).
- **Important**: The sum of all weights must equal **100**.

### Changing Campaign Settings
Modify the `CAMPAIGN` object:
- `NAME`: Changes the title shown in the result modal.
- `COUPON_PREFIX`: Changes the start of the code (e.g., "SUMMER-XXXXXX").
- `EXPIRY_HOURS`: Sets how long the coupon is valid after generation.

---

## 🛡️ Security & Deployment

### Production Database
This project uses **SQLite** for development. For production:
1. Replace `better-sqlite3` with a PostgreSQL driver (e.g., `pg`).
2. Update `discount-wheel/backend/database.js` to use asynchronous queries.
3. Store the database on a managed service (AWS RDS, Supabase, Railway).

### Deployment
1. **Backend**: Deploy to Heroku, Render, or DigitalOcean App Platform.
2. **Frontend**: Deploy to Vercel, Netlify, or host it on your existing e-commerce Shopify/WooCommerce store by linking to the API.
3. **Env Vars**: Change `API_BASE` in `frontend/script.js` to your production server URL.

---

## 📊 Analytics Integration
The current architecture is modular. To add analytics:
- Insert a logging call in `server.js` inside the `/api/spin` endpoint.
- Send data to Firebase, Mixpanel, or your internal SQL database.
