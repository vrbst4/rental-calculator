# Newbridge Rental Property Calculator
# Setup Guide — Auto Property Lookup

This guide walks you through getting the property auto-lookup feature working.
When it's done, you'll be able to type any address or paste a Zillow link and
have all the property data fill in automatically.

**You will need:**
- A computer (Mac or Windows)
- About 20 minutes
- A credit card (for a free Anthropic account — lookups cost about 2 cents each)

There are two paths below. Pick whichever feels more comfortable.

---

## PATH A: Run It On Your Computer (Easiest to Start)

### Step 1: Get an Anthropic API Key

This is what powers the property lookups. Think of it like a password that
lets the calculator use AI to search for property data.

1. Go to **https://console.anthropic.com**
2. Click **Sign Up** and create a free account
3. Add a payment method (you won't be charged until you use it — each lookup costs about $0.02)
4. Once logged in, click **API Keys** in the left sidebar
5. Click **Create Key**
6. Give it a name like "Newbridge Calculator"
7. **Copy the key** — it starts with `sk-ant-` — and save it somewhere safe (you'll need it in Step 3)

> ⚠️ Treat this key like a password. Don't share it or post it anywhere.

---

### Step 2: Install Node.js

Node.js is a free program that runs the calculator's server. You only need to
install it once.

**On a Mac:**
1. Go to **https://nodejs.org**
2. Click the big green button that says **LTS** (it will say something like "22.x.x LTS")
3. Open the downloaded file
4. Click through the installer (Next → Next → Install → Done)

**On Windows:**
1. Go to **https://nodejs.org**
2. Click the big green button that says **LTS**
3. Open the downloaded `.msi` file
4. Click through the installer (Next → accept terms → Next → Install → Finish)
5. **Restart your computer** after installing

**How to check it worked:**
1. Open Terminal (Mac) or Command Prompt (Windows — search for "cmd" in the Start menu)
2. Type: `node --version` and press Enter
3. You should see a version number like `v22.x.x`

---

### Step 3: Set Up the Calculator

1. **Unzip** the `NewbridgeRentalCalculator-Deploy.zip` file you downloaded
   - On Mac: double-click the zip file
   - On Windows: right-click → Extract All

2. You should see a folder with these files inside:
   ```
   server.js
   package.json
   .env.example
   README.md
   public/
     index.html
   ```

3. **Create your settings file:**
   - Find the file called `.env.example`
   - Make a copy of it
   - Rename the copy to just `.env` (remove the `.example` part)
   - Open `.env` in any text editor (TextEdit on Mac, Notepad on Windows)
   - Replace `sk-ant-your-key-here` with the API key you copied in Step 1
   - Save and close the file

   The file should look like this (with your real key):
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
   PORT=3000
   ```

> **Can't see the .env file?** Files starting with a dot are hidden by default.
> - Mac: In Finder, press Cmd+Shift+. (period) to show hidden files
> - Windows: In File Explorer, click View → Show → Hidden Items

---

### Step 4: Start the Calculator

1. **Open Terminal** (Mac) or **Command Prompt** (Windows)

2. **Navigate to the folder.** Type `cd ` (with a space after it), then:
   - **Easiest method:** Drag the unzipped folder from Finder/File Explorer directly
     into the Terminal/Command Prompt window. It will paste the folder path for you.
   - Press Enter

3. **Install the required packages** (first time only):
   ```
   npm install
   ```
   Wait about 30 seconds. You'll see some progress text. This only needs to happen once.

4. **Start the server:**

   On Mac:
   ```
   npm start
   ```

   On Windows:
   ```
   npm start
   ```

5. You should see:
   ```
   Newbridge Calculator running at http://localhost:3000
   API Key: Configured
   ```

6. **Open your browser** and go to: **http://localhost:3000**

That's it! The calculator is running. Go to the **Scenarios** tab, type an
address like `361 Bridge St, Collegeville PA` and click **Look Up**.

**To stop the server:** Go back to Terminal/Command Prompt and press Ctrl+C.

**To start it again later:** Open Terminal, navigate to the folder (Step 4.2), and run `npm start`.

---

## PATH B: Put It Online (So Clients Can Use It Too)

This puts the calculator at a web address anyone can visit. Uses Render.com
which has a free tier.

### Step 1: Get an Anthropic API Key

Same as Path A, Step 1 above.

### Step 2: Create a GitHub Account (If You Don't Have One)

GitHub is where the calculator's code will live. Render.com reads it from there.

1. Go to **https://github.com** and click **Sign Up**
2. Follow the prompts to create a free account

### Step 3: Upload the Code to GitHub

1. Log into GitHub
2. Click the **+** button in the top right corner → **New repository**
3. Name it: `rental-calculator`
4. Make sure **Public** is selected
5. Click **Create repository**
6. On the next page, you'll see an **"uploading an existing file"** link — click it
7. **Drag all the files** from inside your unzipped folder onto the upload area:
   - `server.js`
   - `package.json`
   - `.env.example`
   - `README.md`
   - `.gitignore`
   - The `public` folder (with `index.html` inside)
8. Click **Commit changes**

> ⚠️ Do NOT upload the `.env` file (the one with your real API key).
> Only upload `.env.example`. Your real key goes into Render in the next step.

### Step 4: Deploy on Render.com

1. Go to **https://render.com** and click **Get Started for Free**
2. Sign up using your GitHub account (easiest)
3. Once logged in, click **New** → **Web Service**
4. It will show your GitHub repositories — click **Connect** next to `rental-calculator`
5. Fill in the settings:
   - **Name:** `newbridge-calculator` (or whatever you want)
   - **Region:** Pick the closest one to you (e.g., Ohio for East Coast)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
6. Click **Advanced** and then **Add Environment Variable:**
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** Paste your API key from Step 1
7. Click **Create Web Service**
8. Wait 2-3 minutes while it builds

When it's done, you'll see a green **"Live"** badge and a URL like:
**https://newbridge-calculator.onrender.com**

That's your calculator! Share that link with anyone.

### Step 5: Add a Custom Domain (Optional)

If you want `calculator.newbridgewm.com` instead of the Render URL:

1. In your Render dashboard, click your web service
2. Go to **Settings** → **Custom Domains**
3. Click **Add Custom Domain**
4. Enter: `calculator.newbridgewm.com`
5. Render will show you a CNAME record to add
6. Log into wherever you manage your domain (GoDaddy, Namecheap, etc.)
7. Add a CNAME record pointing `calculator` to the address Render gives you
8. Wait 5-30 minutes for it to activate
9. SSL (the lock icon in the browser) is automatic

---

## How the Auto-Lookup Works

When you type an address or paste a URL and click **Look Up**:

1. Your calculator sends the address to your server
2. Your server asks Claude (AI) to search the web for that property
3. Claude searches Zillow, Redfin, county tax records, and local rental listings
4. It finds: price, beds, baths, sqft, year built, lot size, parking, taxes, HOA, and estimated rent
5. All those fields fill in automatically

**Each lookup costs about $0.02** (two cents). So 100 lookups = $2.00.

**Privacy:** Your clients' financial information (income, tax rates, etc.)
never leaves their browser. Only the property address is sent to the server.

---

## Troubleshooting

**"Server not available" when clicking Look Up**
→ The server isn't running. If using Path A, make sure you ran `npm start`.
   If using Path B, check that your Render service shows "Live."

**"Server missing ANTHROPIC_API_KEY"**
→ Your `.env` file doesn't have the key, or it's not saved correctly.
   Open `.env` and make sure it looks like: `ANTHROPIC_API_KEY=sk-ant-api03-xxxx`

**"Invalid API key"**
→ The key is wrong. Go to console.anthropic.com → API Keys and create a new one.

**"Rate limited"**
→ Too many lookups too fast. Wait 30 seconds and try again.

**Calculator shows white screen**
→ Try refreshing the page. If still broken, clear your browser cache (Ctrl+Shift+Delete).

**I closed Terminal and the calculator stopped**
→ That's normal for Path A. The server only runs while Terminal is open.
   For a permanent solution, use Path B (Render.com).

**The lookup found the wrong property**
→ Be more specific with the address. Include city and state:
   "361 Bridge St, Collegeville, PA 19426" works better than "361 Bridge St"

---

## What Each Lookup Costs

| Action | Cost |
|--------|------|
| One property lookup | ~$0.02 |
| 50 lookups per month | ~$1.00 |
| 200 lookups per month | ~$4.00 |
| Opening the calculator | Free |
| All calculations | Free |
| Hosting on Render free tier | Free |

---

## Need Help?

If you get stuck, take a screenshot of the error and bring it to your next
conversation with Claude. We can troubleshoot it together.
