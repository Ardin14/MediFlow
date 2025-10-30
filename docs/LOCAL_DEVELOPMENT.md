# Local Development Setup Guide

This guide explains how to download and run the HealthFlow Clinic Management System on your local computer.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## Step 1: Download the Source Code

### Option A: Export from Mocha Platform
1. In your Mocha app dashboard, look for an "Export" or "Download" option
2. Download the complete source code as a ZIP file
3. Extract the ZIP file to your desired local directory

### Option B: Manual File Copy
If export isn't available, you can manually copy all the files:
1. Create a new folder on your computer (e.g., `healthflow-clinic`)
2. Copy all the source files from the Mocha platform to this folder

## Step 2: Install Dependencies

Open a terminal/command prompt in your project directory and run:

```bash
npm install
```

This will install all the required packages including:
- React and TypeScript
- Vite (development server)
- Tailwind CSS
- Hono (backend framework)
- Cloudflare Workers tools

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root with your secrets:

```env
MOCHA_USERS_SERVICE_API_KEY=your_api_key_here
MOCHA_USERS_SERVICE_API_URL=your_api_url_here
```

Replace the values with your actual API credentials from the Mocha platform.

## Step 4: Install Cloudflare Wrangler CLI

The app uses Cloudflare Workers and D1 database. Install Wrangler globally:

```bash
npm install -g wrangler
```

Login to your Cloudflare account:

```bash
wrangler auth login
```

## Step 5: Set Up Local Database

Create a local D1 database for development:

```bash
wrangler d1 create healthflow-clinic-dev
```

Update your `wrangler.json` file with the new database ID.

Apply the database migrations:

```bash
wrangler d1 migrations apply healthflow-clinic-dev --local
```

## Step 6: Run the Development Server

Start the local development server:

```bash
npm run dev
```

This will start:
- Vite development server on `http://localhost:5173`
- Cloudflare Workers development environment
- Local D1 database

Open your browser and navigate to `http://localhost:5173` to see your app.

## Development Workflow

### File Structure
```
src/
├── react-app/          # Frontend React application
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   └── App.tsx        # Main app component
├── worker/            # Backend Cloudflare Worker
│   └── index.ts       # API routes and handlers
└── shared/            # Shared types and utilities
    └── types.ts       # TypeScript type definitions
```

### Making Changes

1. **Frontend changes**: Edit files in `src/react-app/`
2. **Backend changes**: Edit files in `src/worker/`
3. **Database changes**: Create new migrations in the migrations folder
4. **Styling**: Modify Tailwind classes or `src/react-app/index.css`

### Database Operations

View local database:
```bash
wrangler d1 execute healthflow-clinic-dev --local --command "SELECT * FROM patients;"
```

Create new migration:
```bash
wrangler d1 migrations create healthflow-clinic-dev "add_new_column"
```

Apply migrations:
```bash
wrangler d1 migrations apply healthflow-clinic-dev --local
```

## Testing Your Changes

1. **Frontend**: Changes are automatically hot-reloaded in the browser
2. **Backend**: Restart the dev server to see API changes
3. **Database**: Use Wrangler commands to inspect data

## Building for Production

Build the application:

```bash
npm run build
```

This creates optimized files ready for deployment.

## Deploying Changes

To deploy your local changes back to production:

```bash
wrangler deploy
```

Make sure to:
1. Apply any new database migrations to production
2. Update environment variables if needed
3. Test thoroughly before deploying

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `vite.config.ts`
2. **Database connection errors**: Ensure Wrangler is logged in and database exists
3. **Missing dependencies**: Run `npm install` again
4. **Environment variables**: Check your `.env.local` file

### Getting Help

- Check the console for error messages
- Review the network tab in browser dev tools for API errors
- Use `wrangler tail` to see live logs from your worker

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [React Documentation](https://reactjs.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Project Architecture

This app follows a modern full-stack architecture:

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite-based)
- **Authentication**: Mocha Users Service
- **Hosting**: Cloudflare Workers platform

The app is designed to be scalable, secure, and easy to maintain. All business logic is kept in the application layer, with the database serving as a simple data store.
