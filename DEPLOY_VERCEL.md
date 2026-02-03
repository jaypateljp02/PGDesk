# 🚀 PGDesk: Full-Stack Vercel Deployment Guide

Follow these steps to deploy both your **Frontend** and **Backend** to Vercel.

> [!WARNING]
> **WhatsApp Automation Limitation**: Vercel is a "Serverless" platform. This means it turns off when not in use. **WhatsApp Web automation will NOT work on Vercel** because it requires a browser and a continuous connection. 
> 
> *If you need WhatsApp automation, you must host the `backend` folder on a server like **Render**, **Railway**, or **DigitalOcean** instead.*

---

## 🏗️ 1. Deploying the Backend (API)
First, you need to deploy the backend to get your API URL.

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project** and import `PGDesk`.
3. In **Project Settings**:
   - **Framework Preset**: Select `Other`.
   - **Project Name**: `pgdesk-api`
   - **Root Directory**: Select the `backend` folder.
4. **Environment Variables**: Add your database and security keys:
   - `MONGODB_URI` (Your MongoDB Atlas link)
   - `JWT_SECRET` (Any long random string)
5. Click **Deploy**. This will give you a URL (e.g., `https://pgdesk-api.vercel.app`).

## ⚙️ 2. Deploying the Frontend (UI)
Now, deploy the user interface and link it to your new API.

1. Click **Add New...** > **Project** and import `PGDesk` again.
2. In **Project Settings**:
   - **Framework Preset**: Select `Vite`.
   - **Project Name**: `pgdesk-app`
   - **Root Directory**: Select the `frontend` folder.
3. **Environment Variables**:
   - **Name**: `VITE_API_URL`
   - **Value**: Use the backend URL you just created (e.g., `https://pgdesk-api.vercel.app`).
4. Click **Deploy**.

---

## 🛠️ Troubleshooting (404 Errors)

### "I get a 404 when I refresh the page"
**Fix**: Relax! I have already included a `vercel.json` file in the `frontend` folder. It handles all routing automatically. As long as you set the **Root Directory** to `frontend`, Vercel will use this file to fix the 404s.

### "It says 'Vite command not found'"
**Fix**: Ensure your **Build Command** is set to `npm run build` and your **Install Command** is `npm install`.

### "The app loads, but nothing works"
**Fix**: Check your `VITE_API_URL` in the environment variables. If it's empty or wrong, the frontend can't talk to the database.

---
*Created by Antigravity for PGDesk.*
