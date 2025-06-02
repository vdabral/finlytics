# Environment Setup Guide

## Prerequisites

Before running the application, you need to set up the following services:

### 1. MongoDB (Required)

**Option A: Local MongoDB (Recommended for development)**
1. Download and install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows (if installed as service)
   net start MongoDB
   
   # Or manually
   mongod --dbpath="C:\data\db"
   ```
3. Your connection string: `mongodb://localhost:27017/portfolio_tracker`

**Option B: MongoDB Atlas (Free tier)**
1. Create account at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### 2. Redis (Optional but recommended)

**Option A: Local Redis**
1. Windows: Download from https://github.com/microsoftarchive/redis/releases
2. Start Redis: `redis-server`
3. Default connection: `localhost:6379`

**Option B: Redis Cloud (Free tier)**
1. Sign up at https://redis.com/redis-enterprise-cloud/
2. Create free database
3. Update Redis settings in `.env`

### 3. Alpha Vantage API Key (Required for market data)

1. Visit https://www.alphavantage.co/support/#api-key
2. Sign up for free account
3. Get your API key (5 calls/minute, 500/day free)
4. Update `ALPHA_VANTAGE_API_KEY` in `.env`

### 4. Google OAuth (Optional - for social login)

1. Go to https://console.developers.google.com/
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/v1/auth/google/callback`
6. Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### 5. Email Service (Optional - for notifications)

**Option A: Ethereal Email (Development)**
1. Visit https://ethereal.email/
2. Create account
3. Use provided SMTP settings in `.env`

**Option B: Gmail (Production)**
1. Enable 2-factor authentication
2. Generate app password
3. Update email settings in `.env`

## Quick Start (Minimal Setup)

For basic functionality, you only need:

1. **MongoDB** (local installation)
2. **Alpha Vantage API key** (free)

Update your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/portfolio_tracker
ALPHA_VANTAGE_API_KEY=YOUR_ACTUAL_API_KEY
```

## Environment Variables Explained

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | 5000 |
| `NODE_ENV` | No | Environment mode | development |
| `MONGODB_URI` | Yes | MongoDB connection string | - |
| `REDIS_HOST` | No | Redis host | localhost |
| `REDIS_PORT` | No | Redis port | 6379 |
| `JWT_SECRET` | Yes | JWT signing secret | - |
| `ALPHA_VANTAGE_API_KEY` | Yes | Market data API key | demo |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth secret | - |
| `EMAIL_HOST` | No | SMTP host | - |
| `EMAIL_USER` | No | Email username | - |
| `EMAIL_PASSWORD` | No | Email password | - |
| `FRONTEND_URL` | No | Frontend URL for CORS | http://localhost:3000 |

## Testing Your Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Test database connection:
   ```bash
   npm run db:health
   ```

3. Seed database with sample data:
   ```bash
   npm run seed
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Test API endpoints:
   - Health check: http://localhost:5000/api/v1/health
   - API docs: http://localhost:5000/api/v1/docs

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check firewall settings
- Verify connection string format

### Redis Connection Issues
- Redis is optional for development
- Comment out Redis-related code if not using

### API Key Issues
- Verify Alpha Vantage API key is valid
- Check rate limits (5 calls/minute for free tier)
- Use 'demo' key for initial testing

### Port Conflicts
- Change PORT in `.env` if 5000 is taken
- Update frontend API URL accordingly

## Security Notes

⚠️ **Important for Production:**

1. Change all default secrets in `.env`
2. Use strong, random JWT secrets
3. Enable HTTPS
4. Set `NODE_ENV=production`
5. Use environment-specific database
6. Enable proper CORS settings
7. Never commit `.env` file to version control
