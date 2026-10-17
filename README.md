# Chai Kenya — Tea Business Manager

A responsive web application built for small tea businesses in Kenya managing wholesale, retail, bulk tea leaves, packaged pouches, and M-Pesa sales.

---

## Features

- **Kenyan Shilling Throughout (`KSh #,##0.00`):** Native Kenyan currency formatting and `Africa/Nairobi` (EAT) date timestamps (`DD/MM/YYYY`).
- **Canonical Grams Inventory:** Stores all inventory in **Grams (`g`)** as the single source of truth, displaying **Kilograms (`kg`)** where appropriate.
- **Auditable Stock Repacking Conversion:** Convert bulk tea leaves (e.g. 50 kg BP1 sack) into retail pouches (e.g. 100 x 500g pouches) with zero double-counting, tracking packaging costs and shrinkage.
- **Stock Movement Ledger:** Perpetual audit log for every transaction: purchases received, sales dispatched, repacking conversions, and audit adjustments.
- **Wholesale & Retail Pricing:** Automatic pricing tier adjustment per customer with manual override, line-item discounts, and credit limits.
- **Payment Methods:** Full tracking for **M-Pesa** (with transaction code input), Cash, Bank Transfer, and Credit terms.
- **Honest Kenya Tax & eTIMS Architecture:** Configurable VAT (16%, 0% Zero-Rated, Exempt). Internal sales receipts clearly disclaimed with placeholder for recording official external eTIMS CU numbers without faking KRA transmissions.
- **P&L & Accounting Reports:** Real mathematical calculation separating Gross Profit (Revenue - COGS) from Net Profit (Gross Profit - Operating Expenses). Does not count customer credit as cash collected.
- **One-Click Backup & Demo Mode:** Works immediately out of the box with offline demo data, and connects seamlessly to Supabase PostgreSQL with Row Level Security.

---

## 10 Functional Modules

1. **Dashboard:** Live KPIs: Sales Today, Sales This Month, Real Cash Collected, Customer Balances Owed, Estimated Gross Profit, Stock Valuation at cost, and Low-Stock Reorder Alerts.
2. **Products & Stock:** Loose tea vs packaged pouches, packet weight configurations (100g, 250g, 500g, 1kg), Repack Modal, Stock Adjustment Modal, and perpetual ledger.
3. **Customers:** Wholesale distributors & retail kiosks, credit limits, payment terms (days), and full ledger statement of invoices and receipts.
4. **Suppliers:** Tea factory estates (Kericho, Nandi, Bomet) and packaging suppliers, order history, and payables.
5. **Purchases:** Purchase orders with logistics/transport costs. **Inventory strictly increases only when goods are marked as received into warehouse.**
6. **Sales & Invoices:** Fast POS sales form, stock availability checks preventing negative stock, M-Pesa transaction reference capture, and print-ready A4/thermal receipt generator.
7. **Payments & Balances:** Customer receipt ledger, supplier disbursement ledger, and debt settlement.
8. **Expenses:** Categorized operating expenses: Transport/SGR logistics, tea pouches, casual packing labour, godown rent, cess levies, and utilities.
9. **Reports:** Date range filter (Today, Last 7 Days, This Month, All Time, Custom Range) with Trading P&L, Cash Inflows vs Credit Issued, and Inventory Valuation at cost.
10. **Business Settings:** Business profile, KRA PIN, VAT registration toggle, printable receipt footer note, JSON backup export, and demo reset.

---

## Getting Started (Quick Run)

### 1. Run Locally

The application is already installed and built in your workspace:

```bash
# Start local server (Default: http://localhost:3000)
npm run start
# Or start in development mode
npm run dev
```

Open your browser to `http://localhost:3000`. You can immediately test creating sales, repacking tea, adding customers, and viewing financial reports!

---

## Connecting Your Supabase PostgreSQL Database

If you want your data saved to your own cloud Supabase database, follow these simple non-technical steps:

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project**, choose a project name (e.g., `simba-tea-manager`), set a database password, and select region **East US** or the closest region to Kenya.
3. Wait about 1-2 minutes for Supabase to finish provisioning your database.

### Step 2: Run the Database Migrations
1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar.
2. Open the file `supabase/migrations/20261017000001_initial_schema.sql` from your project folder, copy its contents, paste it into the Supabase SQL editor, and click **Run**.
3. Next, copy the contents of `supabase/migrations/20261017000002_functions_and_triggers.sql`, paste it into the SQL editor, and click **Run**.
4. *(Optional)* If you want to populate your database with realistic Kenyan tea demo data, copy `supabase/migrations/20261017000003_demo_seed_data.sql`, paste it, and click **Run**.

### Step 3: Add your API Keys
1. In Supabase, go to **Project Settings** (gear icon) -> **API**.
2. Copy your **Project URL** and your **anon / public** key.
3. Open the file `.env.local` in your project folder and paste your keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

4. Restart your app (`npm run dev` or `npm run build && npm run start`). The sidebar status pill will instantly turn green and display **Supabase Live DB**!

---

## Backup & Recovery

- You can export a complete JSON snapshot of your entire business database at any time from **Business Settings -> Export Full JSON Backup**.
- If you ever need to reset to the standard demo data for practice or testing, click **Reset Demo Data** in Settings.
