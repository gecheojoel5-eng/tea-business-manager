# How to Run Your Tea Business Manager on Render (Render.com)

Render is a cloud hosting platform that can host your web application for free or on a low-cost plan. Because you are not a programmer, here are the exact, step-by-step instructions in plain language.

---

## Method 1: Deploy with GitHub (Recommended & Simplest)

Render deploys directly from GitHub in 3 minutes.

### Step 1: Create a GitHub Repository
1. Go to [https://github.com](https://github.com) and sign in (or create a free account).
2. Click the **+** icon in the top right and select **New repository**.
3. Name it `tea-business-manager` (you can choose Public or Private).
4. Do **not** check "Add a README" or ".gitignore" (these are already created for you in your folder).
5. Click **Create repository**.
6. GitHub will display your new repository URL (for example: `https://github.com/YOUR_USERNAME/tea-business-manager.git`).

### Step 2: Push your Code to GitHub
Open your terminal (PowerShell) on your computer, paste these commands and press Enter:

```bash
git remote add origin https://github.com/YOUR_USERNAME/tea-business-manager.git
git push -u origin main
```
*(Replace `YOUR_USERNAME` with your real GitHub username).*

---

### Step 3: Launch on Render
1. Go to [https://render.com](https://render.com) and sign in with your GitHub account.
2. In the Render dashboard, click the blue **New +** button in the top right.
3. Select **Web Service**.
4. You will see a list of your GitHub repositories. Find `tea-business-manager` and click **Connect**.
5. Render will automatically detect the settings from your `render.yaml` file:
   - **Name:** `chai-tea-business-manager`
   - **Region:** Frankfurt (closest to Kenya) or Oregon
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** `Free`
6. Click **Create Web Service** at the bottom of the page.

---

### Step 4: Access your Live App!
Render will start building your application. In about 2-3 minutes, you will see a green **"Live"** badge and Render will give you your free web address, such as:

👉 **`https://chai-tea-business-manager.onrender.com`**

You can now open this URL from your mobile phone, laptop, or tablet anywhere in Kenya!

---

## Adding Supabase Database to Render (Optional)

When you are ready to connect your live Supabase database on Render:
1. In your Render Dashboard, click on your `chai-tea-business-manager` web service.
2. Click **Environment** on the left menu.
3. Add these two environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Click **Save Changes**. Render will automatically redeploy with your live cloud database connected.
