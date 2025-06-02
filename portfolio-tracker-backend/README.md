# Finlytics Backend

A comprehensive investment portfolio tracking backend built with Node.js, Express, MongoDB, and Redis. This smart analytics platform provides real-time portfolio management, market data integration, and user authentication.

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - JWT-based authentication
  - Google OAuth integration
  - Email verification and password reset
  - Role-based access control (User/Admin)

- **Portfolio Management**
  - Create and manage multiple portfolios
  - Real-time portfolio value tracking
  - Holdings management with cost basis tracking
  - Transaction history and analytics

- **Asset Management**
  - Support for stocks, ETFs, cryptocurrencies, and more
  - Real-time price updates via Alpha Vantage API
  - Asset search and discovery
  - Market data caching for performance

- **Real-time Features**
  - WebSocket connections for live price updates
  - Real-time portfolio value changes
  - Instant notifications

- **Background Jobs**
  - Automated price updates
  - Email notifications (daily summaries, alerts)
  - Data cleanup and maintenance

### Technical Features
- **API Versioning** - Future-proof API design
- **Rate Limiting** - Protect against abuse
- **Comprehensive Logging** - Winston-based logging
- **Error Handling** - Centralized error management
- **Input Validation** - Joi and express-validator
- **Caching** - Redis-based caching for performance
- **Monitoring** - Health checks and metrics
- **Documentation** - Swagger/OpenAPI documentation

## 🛠️ Technology Stack

### Backend Framework
- **Node.js** (v18+)
- **Express.js** - Web framework
- **Socket.io** - Real-time communication

### Database & Caching
- **MongoDB** - Primary database
- **Redis** - Caching and session storage

### Authentication
- **JWT** - Token-based authentication
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing

### External APIs
- **Alpha Vantage** - Stock market data (free tier)
- **Google OAuth** - Social authentication

### DevOps & Deployment
- **Docker** - Containerization
- **Kubernetes** - Orchestration
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy and load balancing

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas free tier)
- Redis (local or Redis Cloud free tier)
- Alpha Vantage API key (free)
- Google OAuth credentials (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd portfolio-tracker-backend
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Start MongoDB and Redis (if running locally)
# Then run migrations and seed data
npm run migrate
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📖 API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/api/v1/health`

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/google` - Google OAuth login
- `POST /api/v1/auth/forgot-password` - Password reset

#### Portfolios
- `GET /api/v1/portfolios` - List user portfolios
- `POST /api/v1/portfolios` - Create portfolio
- `GET /api/v1/portfolios/:id` - Get portfolio details
- `PUT /api/v1/portfolios/:id` - Update portfolio
- `DELETE /api/v1/portfolios/:id` - Delete portfolio

#### Assets
- `GET /api/v1/assets/search` - Search assets
- `GET /api/v1/assets/:symbol` - Get asset details
- `POST /api/v1/assets` - Add new asset (Admin)

#### Market Data
- `GET /api/v1/market/price/:symbol` - Get current price
- `GET /api/v1/market/trending` - Get trending assets
- `GET /api/v1/market/quote/:symbol` - Get detailed quote

## 🐳 Docker Deployment

### Development
```bash
npm run docker:dev
```

### Production
```bash
npm run docker:build
npm run docker:prod
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster
- kubectl configured
- Container registry access

### Deploy
```bash
# Update image references in k8s/ files
npm run k8s:deploy
```

### Remove
```bash
npm run k8s:delete
```

## 🧪 Testing

### Run Tests
```bash
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:integration    # Integration tests only
```

### Load Testing
```bash
npm run load-test           # Basic load test
npm run load-test:stress    # Stress test
npm run load-test:websocket # WebSocket test
```

## 📊 Performance Monitoring

### Database Optimization
```bash
npm run db:optimize         # Full analysis
npm run db:health           # Health check only
```

### System Monitoring
- Health checks: `/api/v1/health`
- Metrics: `/api/v1/monitoring/metrics`
- System status: `/api/v1/monitoring/status`

## 🔧 Development

### Code Quality
```bash
npm run lint                # ESLint check
npm run lint:fix            # Auto-fix issues
```

### Database Management
```bash
npm run migrate             # Run migrations
npm run migrate:status      # Check migration status
npm run seed                # Seed sample data
npm run cleanup             # Manual cleanup
```

### Background Jobs
```bash
npm run update-prices       # Manual price update
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── handlers/        # WebSocket handlers
├── jobs/           # Background jobs
├── middleware/     # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
└── utils/          # Utility functions

scripts/
├── migrations/     # Database migrations
├── performance/    # Performance tools
├── migrate.js      # Migration runner
└── seed.js         # Data seeding

tests/
├── integration/    # Integration tests
├── helpers/        # Test utilities
└── *.test.js       # Unit tests

k8s/               # Kubernetes manifests
├── app.yaml       # Application deployment
├── mongodb.yaml   # MongoDB deployment
├── redis.yaml     # Redis deployment
└── ...

docker-compose.yml     # Production Docker setup
docker-compose.dev.yml # Development Docker setup
Dockerfile            # Container definition
nginx.conf           # Nginx configuration
```

## 🔐 Security Features

- **Input Validation** - All inputs validated with Joi/express-validator
- **Rate Limiting** - API rate limiting with express-rate-limit
- **CORS Protection** - Configurable CORS settings
- **Helmet.js** - Security headers
- **JWT Security** - Secure token handling
- **Password Hashing** - bcryptjs with salt rounds
- **SQL Injection Prevention** - MongoDB ORM protection
- **Environment Variables** - Sensitive data in environment

## 🚀 Production Considerations

### Scaling
- Horizontal Pod Autoscaling configured
- Redis for session sharing across instances
- Database connection pooling
- Caching strategies implemented

### Monitoring
- Comprehensive logging with Winston
- Health check endpoints
- Performance metrics collection
- Error tracking and alerting

### Backup & Recovery
- MongoDB replica sets recommended
- Redis persistence enabled
- Regular backup strategies
- Disaster recovery procedures

## 📝 API Versioning

The API supports versioning through:
- URL path: `/api/v1/...`
- Header: `API-Version: v1`
- Query parameter: `?version=v1`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

### Development Workflow
1. `npm run dev` - Start development server
2. `npm test` - Run tests
3. `npm run lint` - Check code quality
4. `npm run docs` - Generate API documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Database Connection Issues**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity

**API Rate Limiting**
- Default: 100 requests per 15 minutes
- Adjust in environment variables
- Use API keys for higher limits

**WebSocket Connection Issues**
- Check CORS configuration
- Verify Socket.io client version compatibility
- Check firewall settings

### Getting Help
- Create an issue on GitHub
- Check the documentation
- Review the test files for examples

## 🗺️ Roadmap

### Near Term
- [ ] Advanced portfolio analytics
- [ ] More asset types support
- [ ] Mobile push notifications
- [ ] Advanced charting data

### Long Term
- [ ] Machine learning price predictions
- [ ] Social trading features
- [ ] Advanced reporting
- [ ] Multi-currency support

---

**Built with ❤️ for the developer community using 100% free tools and services.**
