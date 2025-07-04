const express = require("express");
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const authjwt = require('./middleware/auth');
const connectDB = require('./utils/connectionMongodb');
const morgan = require('morgan'); // Optional: for request logging


// Route imports
const authRoutes = require('./api/auth/login');
const signupRoutes = require('./api/auth/signup');
const logoutRoutes = require('./api/auth/logout');
const ProductOfferingCatalog = require('./api/ProductOfferingCatalog/index')
const ProductOfferingCategory = require('./api/ProductOfferingCategory/index')
const ProductOffering = require('./api/ProductOffering/index')
const channel = require('./api/channel/index')
const ProductSpecification = require('./api/ProductSpecification/index');
const AiSearch = require('./api/ai-search/index')
const measurmentUnit = require('./api/unit-of-measurment/index')
const account = require('./api/account/index')
const contact = require('./api/contact/index')
const location = require('./api/location/index')
const opportunity = require("./api/opportunity/index");
const ProductOfferingPrice = require("./api/productOfferingPrice/index")
const opportunityLine = require("./api/OpportunityLine/index")
const priceList = require("./api/PriceList/index")
const nlpRoutes = require('./api/ai-search/nlp');
const chatbotCases = require('./api/ai-search/getCases');
const Quote = require('./api/quote/index');
const productsRouter = require('./controllers/ProductOffering/servicenowproducts');
const emailroutes = require('./email/router');
const contract = require('./api/contract');
const contractQuote = require('./api/contractQuote')
    // const createAccount = require('./api/createAccount/index')
const knowledgeBaseRoute = require('./api/ai-search/chatboot');
const productOfferingRoute = require('./api/ai-search/productoffering');
const productSpecRoutes = require('./api/ProductSpecification/productSpecRoutes');


require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
connectDB();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // Limit each IP to 100 requests per window
});


// connection Kafka
// const producer = require('./utils/connectionKafka');
app.set('trust proxy', 1);

// Configuration

const allowedOrigins = [
    'https://omt-team-one.vercel.app',
    'https://omt-team-dhxpck1wp-jmili-mouads-projects.vercel.app',
    'https://delightful-sky-0cdf0611e.6.azurestaticapps.net',
    'http://localhost:5173',
    'https://superb-starburst-b1a498.netlify.app/'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization']
}));

app.use(limiter);
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
    setHeaders: (res, path) => {
        res.set('X-Content-Type-Options', 'nosniff');
    }
}));

// Optional: Request logging (only in development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Logs requests in the 'dev' format
}
app.use('/', productsRouter);

// Routes
app.use('/api', [
    authRoutes, // Login
    signupRoutes, // Registration + confirmation
    emailroutes,
    // createAccount,
    Quote,
    contact,
    location,
    account,
    logoutRoutes,
    productOfferingRoute,
    knowledgeBaseRoute,
    ProductSpecification,
    productSpecRoutes


]);


// Protected routes
app.use('/api', authjwt, [
    // routes that need middaleware
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
    Quote,
    contractQuote

]);





// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Graceful shutdown on SIGINT
process.on('SIGINT', async() => {
    console.log('\nGracefully shutting down...');
    // Perform DB cleanup or any other necessary shutdown tasks
    process.exit(0);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    // Optionally, add some custom cleanup here if necessary
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`Server running on http://localhost:${PORT}`);
    // Logging some environment settings for debugging purposes
    console.log('MongoDB URL:', process.env.MONGO_URI ? '[hidden]' : 'Not set');
    console.log('ServiceNow URL:', process.env.SERVICE_NOW_URL || 'Not set');
});