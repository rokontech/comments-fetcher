# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Generate Session Secret

Generate a secure random string for session encryption:

**On macOS/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Step 3: Create Environment File

Create a `.env.local` file in the root directory:

```bash
SESSION_SECRET=paste-your-generated-secret-here
```

**Important:** Make sure your `SESSION_SECRET` is at least 32 characters long!

## Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Security Improvements Over HTML Version

✅ **Server-side token storage** - Tokens stored in encrypted HTTP-only cookies  
✅ **No localStorage** - Tokens never stored in browser localStorage  
✅ **API routes** - All GitHub API calls made server-side  
✅ **Token never exposed** - Tokens never sent to or visible in browser  
✅ **Security headers** - HSTS, XSS protection, and more  

## Production Deployment

1. Set `SESSION_SECRET` in your hosting platform's environment variables
2. Ensure HTTPS is enabled (required for secure cookies)
3. Build and deploy:

```bash
npm run build
npm start
```

## Troubleshooting

**"Failed to store token" error:**
- Make sure `SESSION_SECRET` is set in `.env.local`
- Ensure the secret is at least 32 characters long

**"No token found" error:**
- Make sure you've entered and saved your GitHub token
- Check that cookies are enabled in your browser

**GitHub API errors:**
- Verify your token has the `repo` scope
- For organization repos, you may need `read:org` scope
- If using SAML SSO, authorize the token for your organization

