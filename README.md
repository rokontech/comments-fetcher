# comments Fetcher

A secure Next.js application to extract and organize comments suggestions from GitHub pull requests.

## Security Features

✅ **Server-side token storage** - Tokens are stored securely in encrypted session cookies, never in localStorage  
✅ **API routes** - All GitHub API calls are made server-side, tokens never exposed to the browser  
✅ **Encrypted sessions** - Uses `iron-session` for secure, encrypted session management  
✅ **Security headers** - Includes HSTS, XSS protection, and other security headers  
✅ **No client-side token exposure** - Tokens are never sent to or stored in the browser  

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Generate a secure session secret:

```bash
openssl rand -base64 32
```

Add it to `.env.local`:

```
SESSION_SECRET=your-generated-secret-here
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Token Storage**: When you enter your GitHub token and choose to save it, it's sent to `/api/auth/token` which stores it securely in an encrypted server-side session cookie.

2. **Fetching Comments**: When you request comments, the frontend sends the PR URL to `/api/github/comments`. This API route:
   - Retrieves the token from the secure session
   - Makes the GitHub API request server-side
   - Returns only the comments data to the browser
   - The token never leaves the server

3. **Security**: All tokens are encrypted using `iron-session` and stored in HTTP-only cookies, making them inaccessible to JavaScript and protected from XSS attacks.

## Production Deployment

1. Set `SESSION_SECRET` in your production environment variables
2. Ensure HTTPS is enabled (required for secure cookies)
3. Build and deploy:

```bash
npm run build
npm start
```

## Migration from HTML Version

The original HTML version stored tokens in localStorage, which was vulnerable to XSS attacks. This Next.js version:

- Stores tokens server-side in encrypted sessions
- Never exposes tokens to the browser
- Makes all GitHub API calls server-side
- Includes security headers and best practices

Your tokens are now much more secure! 🔒

