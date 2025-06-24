const express = require("express");
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); // Added for cookie support
const rateLimit = require('express-rate-limit');
const verifyCookieAuth = require('./middleware/auth'); // Renamed to be more descriptive
const connectDB = require('./utils/connectionMongodb');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');


// Route imports
const authRoutes = require('./api/auth/login');
const signupRoutes = require('./api/auth/signup');
const logoutRoutes = require('./api/auth/logout');
const ProductOfferingCatalog = require('./api/ProductOfferingCatalog/index');
const ProductOfferingCategory = require('./api/ProductOfferingCategory/index');
const ProductOffering = require('./api/ProductOffering/index');
const channel = require('./api/channel/index');
const ProductSpecification = require('./api/ProductSpecification/index');
const AiSearch = require('./api/ai-search/index');
const measurmentUnit = require('./api/unit-of-measurment/index');
const account = require('./api/account/index');
const contact = require('./api/contact/index');
const location = require('./api/location/index');
const opportunity = require("./api/opportunity/index");
const ProductOfferingPrice = require("./api/productOfferingPrice/index");
const opportunityLine = require("./api/OpportunityLine/index");
const priceList = require("./api/PriceList/index");
const nlpRoutes = require('./api/ai-search/nlp');
const chatbotCases = require('./api/ai-search/getCases');
const Quote = require('./api/quote/index');
const emailroutes = require('./email/router');
const contract = require('./api/contract');
const knowledgeBaseRoute = require('./api/ai-search/chatboot');
const productOfferingRoute = require('./api/ai-search/productoffering');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});

const allowedOrigins = [
  'https://omt-team-one.vercel.app',
  'https://omt-team-dhxpck1wp-jmili-mouads-projects.vercel.app',
  'https://delightful-sky-0cdf0611e.6.azurestaticapps.net',
  'http://localhost:5173',
  'https://superb-starburst-b1a498.netlify.app'
];

const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Session middleware must come after CORS but before routes
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI,
    ttl: 8 * 60 * 60 // 8 hours
  }),
  cookie: {
    httpOnly: true,
    secure: false, // false for localhost, true in production
    sameSite: 'Lax', // 'Lax' for local development
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // This is crucial for cookies
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization', 'Set-Cookie'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middleware setup
app.use(cookieParser()); // Must be before other middleware
app.use(limiter);
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Public routes
app.use('/api', [
  authRoutes,
  signupRoutes,
  emailroutes,
  Quote,
  contact,
  location,
  account,
  logoutRoutes,
  productOfferingRoute,
  knowledgeBaseRoute,
  ProductSpecification
]);

// Protected routes
app.use('/api', verifyCookieAuth, [
  ProductOfferingCatalog,
  ProductOfferingCategory,
  ProductOffering,
  channel,
  ProductSpecification,
  AiSearch,
  measurmentUnit,
  priceList,
  opportunity,
  opportunityLine,
  ProductOfferingPrice,
  nlpRoutes,
  chatbotCases,
  contract,
  Quote
]);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cookies: req.cookies // For debugging
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Cross-origin request blocked'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    receivedCookies: req.cookies // For debugging
  });
});

// Server shutdown handlers
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('MongoDB URL:', process.env.MONGO_URI ? '[hidden]' : 'Not set');
  console.log('ServiceNow URL:', process.env.SERVICE_NOW_URL || 'Not set');
  console.log('Cookie settings:', {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    httpOnly: true
  });
});