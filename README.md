# PGDesk 🏠

[![PWA Support](https://img.shields.io/badge/PWA-Ready-orange)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![React](https://img.shields.io/badge/Frontend-React%2019-blue)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green)](https://nodejs.org/)

**PGDesk** is a modern, premium Paying Guest (PG) Management Software designed for simplicity and efficiency. It features full **Hindi/English localization**, one-click **WhatsApp automation**, and is fully installable as a **phone app (PWA)**.

![PGDesk Hero Image](/C:/Users/Jay%20Patel/.gemini/antigravity/brain/80f46e41-a84f-4c24-bacc-608c39d068cd/pgdesk_minimal_512.png)

## ✨ Unique Features

### 🌍 Smart Localization (Hindi & English)
- **Native Experience**: Switch between Hindi and English seamlessly.
- **Hindi Digits (०-९)**: All numbers, currency (₹), and dates automatically convert to Hindi digits for a localized experience.
- **Indian Number System**: Correct comma grouping (e.g., ₹१,२३,४५६) for rent amounts.

### 📱 Installable Mobile App (PWA)
- **No Store Needed**: Install directly from your mobile browser (Add to Home Screen).
- **Standalone Mode**: Full-screen, app-like experience with a custom PGDesk icon.
- **Fast & Light**: Highly responsive UI built for slow mobile connections.

### 💬 WhatsApp Automation
- **Rent Reminders**: Send personalized rent reminders to all residents with one click.
- **Integration**: Securely connect your WhatsApp via QR code directly in Settings.

### 🏠 Comprehensive Management
- **Rooms & Beds**: Support for room sections, floor-wise management, and detailed occupancy tracking.
- **Resident Profiles**: Track join dates, rent history, and contact details.
- **Food Tracker**: Manage daily breakfast, lunch, and dinner counts for the mess.

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Automation**: WhatsApp-web.js
- **State Management**: React Context API

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jaypateljp02/PGDesk.git
   cd PGDesk
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🚀 Deployment

### Frontend (Vercel)
When deploying to Vercel, use these settings:
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Add `VITE_API_URL` pointing to your hosted backend.

> [!TIP]
> I have added a `vercel.json` file in the `frontend` directory to handle SPA routing (this prevents 404 errors on page refresh).

### Backend (Render/Railway/Heroku)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `WHATSAPP_SESSION_ID`.

