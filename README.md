# Uptime Monitor

A self-hosted uptime monitoring tool built with Next.js, Neon PostgreSQL, and Vercel. Monitor your websites and APIs, track response times and SSL certificates, receive email alerts when endpoints go down, and view everything in a clean dashboard.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bseymour/Website-Uptime-Monitor-template&env=DATABASE_URL,NEXT_PUBLIC_VERCEL_APP_CLIENT_ID,VERCEL_APP_CLIENT_SECRET,ALLOWED_EMAILS,CRON_SECRET&envDescription=Configuration%20for%20Uptime%20Monitor&envLink=https://github.com/bseymour/Website-Uptime-Monitor-template%23complete-setup-guide)

### 🚀 Live Demo

[View Live Demo](https://uptimer-demo.vercel.app/) — See the dashboard in action with sample data.

## Features

- **Endpoint Monitoring** - Add any HTTP/HTTPS endpoint with configurable check intervals (5 minutes to 24 hours), HTTP methods (GET/HEAD/POST), expected status codes, and timeout thresholds
- **SSL Certificate Tracking** - Automatically checks SSL certificate validity and expiry for HTTPS endpoints. Marks monitors as "degraded" when certificates have fewer than 14 days remaining
- **Response Time Charts** - Visualizes response time history using area charts built with Recharts, showing performance trends over time
- **Uptime History Bar** - A compact 30-segment color bar showing the status of recent checks at a glance (green = up, red = down, amber = degraded)
- **Incident Management** - Automatically creates incidents when a monitor goes down and resolves them when it recovers. Full incident history with timestamps
- **Email Alerts** - Sends "down" and "recovery" email notifications via Resend when monitor status changes. All alerts are logged to the database
- **Manual Checks** - "Check All Now" button on the dashboard and per-monitor "Run Check" button to trigger checks on demand
- **Automated Cron Checks** - Vercel Cron runs on a configurable schedule (default: every 10 minutes), checking monitors that are due based on their configured interval
- **Authentication** - Sign In with Vercel (OAuth PKCE flow). Access is restricted to an email whitelist you control

## Tech Stack

| Layer         | Technology                                     |
|---------------|------------------------------------------------|
| Framework     | Next.js 16 (App Router)                        |
| Database      | Neon (Serverless PostgreSQL)                   |
| Auth          | Sign In with Vercel (OAuth 2.0 PKCE)          |
| Alerts        | Resend (email API)                             |
| UI            | shadcn/ui, Tailwind CSS, Recharts              |
| Deployment    | Vercel (with Cron Jobs)                        |
| Data Fetching | SWR (client-side), server-side via Neon driver |

## Quick Start

### Option 1: Deploy with Vercel (Recommended)

1. Click the **"Deploy with Vercel"** button above
2. Follow the setup steps below to configure your services
3. The deployment will guide you through connecting your GitHub repository

### Option 2: Manual Setup

1. Clone this repository
2. Push to your GitHub account
3. Import the repository into Vercel
4. Follow the setup steps below to configure your services

## Complete Setup Guide

This guide will walk you through setting up all required services and configuring the application.

### Prerequisites

Before you begin, make sure you have:
- A [Vercel](https://vercel.com) account (free tier works)
- A [Neon](https://neon.tech) account (free tier works)
- Optionally, a [Resend](https://resend.com) account for email alerts (free tier available)

---

### Step 1: Deploy to Vercel

1. **Import the project**:
   - If using the template: Click "Deploy" and select your Vercel account
   - If deploying manually: Go to [Vercel Dashboard](https://vercel.com/dashboard) > **Add New** > **Project** > Import your repository

2. **Initial deployment**: Vercel will deploy your project, but it won't work yet until we configure the services below.

---

### Step 2: Set Up Neon Database

Neon provides a serverless PostgreSQL database that works seamlessly with Vercel.

#### Option A: Using Vercel Storage Integration (Recommended)

1. In your Vercel project dashboard, go to the **Storage** tab
2. Click **Create Database** > Select **Neon**
3. Choose a name for your database (e.g., "uptime-monitor-db")
4. Select a region close to your users
5. Click **Create**
6. Vercel will automatically set the `DATABASE_URL` environment variable for you

#### Option B: Manual Neon Setup

1. Go to [Neon Console](https://console.neon.tech)
2. Click **Create Project**
3. Choose a name and region
4. Copy your connection string (it looks like: `postgresql://user:password@host.neon.tech/dbname`)
5. In Vercel, go to **Settings** > **Environment Variables** and add:
   - Key: `DATABASE_URL`
   - Value: Your Neon connection string

#### Initialize the Database Schema

1. Go to your Neon dashboard and open the **SQL Editor**
2. Copy the entire contents of `scripts/setup-database.sql` from this repository
3. Paste it into the SQL Editor and click **Run**
4. Alternatively, use the Neon CLI:
   ```bash
   psql $DATABASE_URL -f scripts/setup-database.sql
   ```

You should see messages confirming that tables and indexes were created.

---

### Step 3: Create a Vercel OAuth App

This application uses "Sign In with Vercel" for authentication. You need to create an OAuth app in your Vercel account.

1. **Go to Vercel OAuth Apps**:
   - Navigate to [Vercel Dashboard](https://vercel.com/dashboard) > **Settings** > **OAuth Apps**
   - Click **Create App**

2. **Configure Basic Settings**:
   - **Name**: Enter a name for your app (e.g., "Uptime Monitor")
   - **Website**: Enter your deployed Vercel URL (e.g., `https://your-app.vercel.app`)
   - Click **Create App**

3. **Set Up Authentication**:
   - Go to the **Authentication** tab
   - Under **Callback URLs**, click **Add Callback URL**
   - Enter: `https://your-app.vercel.app/api/auth/callback`
   - Replace `your-app.vercel.app` with your actual Vercel deployment URL
   - Click **Save**

4. **Configure Permissions**:
   - Go to the **Permissions** tab
   - Enable **Email** access (required for authentication)
   - Click **Save**

5. **Get Your Credentials**:
   - Go to the **Overview** tab
   - Copy the **Client ID** (you'll need this)
   - Click **Generate Client Secret** and copy the secret (you'll need this too)
   - ⚠️ **Important**: Save the Client Secret immediately - you won't be able to see it again!

---

### Step 4: Configure Environment Variables

In your Vercel project dashboard, go to **Settings** > **Environment Variables** and add the following:

#### Required Variables

| Variable                           | Description                                   | How to Get It                                    |
|------------------------------------|-----------------------------------------------|--------------------------------------------------|
| `DATABASE_URL`                     | Neon database connection string               | Auto-set if using Vercel Storage, or copy from Neon dashboard |
| `NEXT_PUBLIC_VERCEL_APP_CLIENT_ID` | OAuth Client ID                               | From Step 3 - Vercel OAuth App Overview tab      |
| `VERCEL_APP_CLIENT_SECRET`         | OAuth Client Secret                           | From Step 3 - Generated in Vercel OAuth App     |
| `ALLOWED_EMAILS`                   | Comma-separated allowed emails                | Your email(s), e.g., `you@example.com,team@example.com` |
| `CRON_SECRET`                      | Secret to secure cron endpoint                | Generate with: `openssl rand -hex 32` or any random string |

#### Optional Variables (for Email Alerts)

| Variable         | Description                                   | Default                                          |
|------------------|-----------------------------------------------|--------------------------------------------------|
| `RESEND_API_KEY` | Resend API key for sending alerts             | Required only if you want email alerts          |
| `ALERT_EMAILS`   | Comma-separated emails to receive alerts     | Required only if you want email alerts          |
| `ALERT_FROM_EMAIL` | "From" address for alert emails            | `Uptime Monitor <onboarding@resend.dev>`        |

#### Development Variable

| Variable      | Description                                    | Default |
|---------------|------------------------------------------------|---------|
| `BYPASS_AUTH` | Set to `true` for local dev without OAuth      | `false` |

**Important Notes**:
- Make sure to add these variables for **Production**, **Preview**, and **Development** environments as needed
- After adding variables, **redeploy** your application for changes to take effect
- The `CRON_SECRET` should be a long, random string. You can generate one using:
  ```bash
  openssl rand -hex 32
  ```

---

### Step 5: Set Up Resend (Optional - for Email Alerts)

If you want to receive email alerts when monitors go down, set up Resend:

1. **Create a Resend Account**:
   - Go to [resend.com](https://resend.com) and sign up (free tier available)

2. **Get Your API Key**:
   - Go to [Resend Dashboard](https://resend.com/api-keys)
   - Click **Create API Key**
   - Give it a name (e.g., "Uptime Monitor")
   - Copy the API key (starts with `re_`)

3. **Verify Your Domain** (Recommended):
   - Go to [Resend Domains](https://resend.com/domains)
   - Add your domain and follow the DNS verification steps
   - This allows you to send from your own domain instead of `onboarding@resend.dev`

4. **Add to Vercel Environment Variables**:
   - `RESEND_API_KEY`: Your Resend API key
   - `ALERT_EMAILS`: Comma-separated list of emails to notify (e.g., `alerts@example.com,team@example.com`)
   - `ALERT_FROM_EMAIL`: Your verified domain email (e.g., `Uptime Monitor <noreply@yourdomain.com>`)

**Note**: If you skip Resend setup, the app will work fine but won't send email alerts. All other features will function normally.

---

### Step 6: Configure Vercel Cron

The `vercel.json` file already includes the cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/check",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

This runs every 10 minutes. On each run, the cron job checks which monitors are due (based on their individual check intervals) and runs only those.

**Important**: 
- Vercel Cron requires a **Pro** or **Enterprise** plan for per-minute scheduling
- On the **Hobby** (free) plan, the minimum interval is **once per day**
- If you're on the free plan, you can change the schedule to `0 0 * * *` (once daily) or upgrade to Pro

To modify the schedule, edit `vercel.json` and redeploy.

> **⚡ Cost vs Freshness:** The default cron schedule of `*/10` (every 10 minutes) is a balance between data freshness and database cost. If you are on the Neon **free tier** (0.5 GB storage, 100 compute-hours/month), a less frequent schedule will reduce both storage growth and compute usage. Conversely, if you need faster detection of outages and are on a paid database plan, you can increase the frequency — e.g. `*/5 * * * *` (every 5 minutes) or `* * * * *` (every minute). Keep in mind that more frequent checks mean more rows in `check_results` and more compute time. Adjust this based on your monitoring needs and database plan.

### Data Retention

The cron job automatically prunes old data to prevent unbounded storage growth:
- **Check results** older than **30 days** are deleted on each cron run
- **Resolved incidents** older than **90 days** are deleted on each cron run

> **📦 Storage Tradeoff:** If you are on the Neon free tier (0.5 GB), the 30-day retention window is designed to keep storage manageable. If you need longer history (and have a paid plan), you can adjust the retention period in `app/api/cron/check/route.ts` — look for the `interval '30 days'` and `interval '90 days'` values in the data pruning section. Conversely, if storage is still tight, you can reduce retention to 7 or 14 days.

---

### Step 7: Redeploy and Test

1. **Redeploy your application**:
   - Go to your Vercel project dashboard
   - Click **Deployments** > **Redeploy** (or push a new commit)
   - Wait for the deployment to complete

2. **Test the setup**:
   - Visit your deployed URL (e.g., `https://your-app.vercel.app`)
   - You should see the login page
   - Click **Sign in with Vercel**
   - Complete the OAuth flow
   - If your email is in `ALLOWED_EMAILS`, you'll be redirected to the dashboard
   - Click **Add Monitor** to add your first endpoint
   - Use **Check All Now** to trigger an immediate check

---

## Local Development

For local development, you can bypass the OAuth flow:

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd uptime-monitor
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```
   > **Note**: This project uses [pnpm](https://pnpm.io). If you don't have pnpm installed, you can install it with `npm install -g pnpm`, or use `npm install` instead (though pnpm is recommended).

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Fill in your values (at minimum, you need `DATABASE_URL` and `ALLOWED_EMAILS`)
   - Set `BYPASS_AUTH=true` to skip OAuth

4. **Run the development server**:
   ```bash
   pnpm dev
   ```
   > **Note**: If using npm, use `npm run dev` instead.

5. **Access the app**:
   - Open [http://localhost:3000](http://localhost:3000)
   - With `BYPASS_AUTH=true`, you'll be automatically logged in as the first email in `ALLOWED_EMAILS`

---

## Troubleshooting

### "Unauthorized" error when accessing the app

- Check that `ALLOWED_EMAILS` includes your email address
- Verify that `NEXT_PUBLIC_VERCEL_APP_CLIENT_ID` and `VERCEL_APP_CLIENT_SECRET` are set correctly
- Make sure the callback URL in your Vercel OAuth App matches your deployment URL

### Database connection errors

- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Check that you've run the database setup script (`scripts/setup-database.sql`)
- Ensure your Neon database is active (not paused)

### Cron jobs not running

- Verify you're on a Vercel Pro or Enterprise plan (required for per-minute cron)
- Check that `CRON_SECRET` is set in environment variables
- Verify the cron schedule in `vercel.json` is correct
- Check Vercel logs for cron execution errors

### Email alerts not sending

- Verify `RESEND_API_KEY` is set correctly
- Check that `ALERT_EMAILS` includes valid email addresses
- Ensure your Resend account has available credits
- Check the `alert_log` table in your database for error messages

### "Missing required environment variable" error

- Review the environment variables section above
- Ensure all required variables are set in Vercel
- Redeploy after adding new environment variables

---

## Project Structure

```
app/
  api/
    auth/
      authorize/route.ts   # Initiates OAuth PKCE flow
      callback/route.ts    # Handles OAuth callback
      signout/route.ts     # Revokes token and clears session
    cron/
      check/route.ts       # Vercel Cron endpoint (runs every 10 minutes)
    dashboard/route.ts    # Aggregated dashboard data
    incidents/route.ts    # Incident history
    monitors/
      route.ts             # CRUD for monitors (list/create)
      [id]/route.ts        # Single monitor (get/update/delete)
      [id]/check/route.ts  # Trigger manual check for one monitor
      [id]/checks/route.ts # Check result history for one monitor
      check-all/route.ts   # Trigger manual check for all monitors
  dashboard/
    page.tsx               # Main dashboard page (server component)
    monitors/[id]/page.tsx # Monitor detail page (server component)
  login/page.tsx           # Login page
  page.tsx                 # Root redirect

components/
  dashboard-header.tsx     # Top nav with user avatar and sign-out
  dashboard-view.tsx       # Main dashboard layout (client component)
  monitor-detail.tsx       # Individual monitor detail view
  monitor-table.tsx        # Monitor list with inline status
  stat-cards.tsx           # Summary stats cards
  status-badge.tsx         # Color-coded status pill
  uptime-bar.tsx           # Visual uptime history bar
  response-time-chart.tsx  # Recharts response time area chart
  add-monitor-dialog.tsx   # Dialog form to add a monitor
  edit-monitor-dialog.tsx  # Dialog form to edit a monitor
  login-card.tsx           # Sign-in card with Vercel OAuth

lib/
  auth.ts                  # Session management and email whitelist
  checker.ts               # HTTP check + SSL certificate check logic
  alerts.ts                # Email alert system via Resend
  db.ts                    # Neon database client
  queries.ts               # All database queries
  types.ts                 # TypeScript interfaces
  validation.ts            # Input validation utilities
  env.ts                   # Environment variable validation

scripts/
  setup-database.sql       # Database schema (tables + indexes)
```

---

## Database Schema

The app uses four tables:

- **monitors** - Endpoint configurations (URL, method, interval, timeout, expected status)
- **check_results** - Individual check results (status, response time, SSL info, errors)
- **incidents** - Downtime incidents with start/resolve timestamps
- **alert_log** - Record of every alert sent (channel, recipient, success/failure)

All tables use `gen_random_uuid()` for primary keys and include appropriate indexes for query performance. Cascading deletes ensure that removing a monitor cleans up all related records.

---

## API Routes

| Method | Path                           | Auth     | Description                          |
|--------|--------------------------------|----------|--------------------------------------|
| GET    | `/api/auth/authorize`          | Public   | Initiates OAuth flow                 |
| GET    | `/api/auth/callback`           | Public   | OAuth callback handler               |
| POST   | `/api/auth/signout`            | Session  | Sign out and revoke token            |
| GET    | `/api/dashboard`               | Session  | Dashboard data (monitors + stats)    |
| GET    | `/api/monitors`                | Session  | List all monitors                    |
| POST   | `/api/monitors`                | Session  | Create a monitor                     |
| GET    | `/api/monitors/:id`            | Session  | Get a single monitor                 |
| PUT    | `/api/monitors/:id`            | Session  | Update a monitor                     |
| DELETE | `/api/monitors/:id`            | Session  | Delete a monitor                     |
| POST   | `/api/monitors/:id/check`      | Session  | Trigger manual check for one monitor |
| GET    | `/api/monitors/:id/checks`     | Session  | Check result history                 |
| POST   | `/api/monitors/check-all`      | Session  | Trigger manual check for all monitors|
| GET    | `/api/incidents`               | Session  | List incidents                       |
| GET    | `/api/cron/check`              | Cron     | Automated check endpoint             |

---

## Security Considerations

- **Input Validation**: All URLs are validated to prevent SSRF attacks (private IPs are blocked)
- **SQL Injection**: All database queries use parameterized queries
- **Authentication**: OAuth PKCE flow with state and nonce validation
- **Session Security**: HTTP-only, secure cookies with SameSite protection
- **Cron Security**: Cron endpoint protected by `CRON_SECRET` bearer token
- **Email Whitelist**: Access restricted to emails in `ALLOWED_EMAILS`

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the Vercel, Neon, and Resend documentation
3. Open an issue on GitHub

---

**Made with ❤️ using Next.js, Neon, and Vercel**
