const express = require('express');
const axios = require('axios');
const tf = require('@tensorflow/tfjs');
require('dotenv').config();

const router = express.Router();

const SERVICE_NOW_CONFIG = {
  baseUrl: process.env.SERVICE_NOW_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.SERVICENOW_USERNAME || 'mouad.abarhane',
  password: process.env.SERVICE_NOW_PASSWORD || '&=TrK#)1#Isguye4HQ!*qp*m&0@cSPoC5iF3=7R*G]OIm,B$<C*0.eG9RgoT&b.',
  tables: {
    product_offering: 'sn_prd_pm_product_offering',
    product_spec: 'sn_prd_pm_product_specification',
    offering_category: 'sn_prd_pm_product_offering_category',
    offering_catalog: 'sn_prd_pm_product_offering_catalog',
    quote: 'sn_quote_mgmt_core_quote',
    opportunity: 'sn_opty_mgmt_core_opportunity',
  }
};

// === Model Storage ===
let trainedProductModel = null;
let trainedOpportunityModel = null;
let trainedQuoteModel = null;
let trainedProductSpecModel = null;
let trainedCategoryModel = null;
let trainedCatalogModel = null;

// === Authentication Middleware ===
const authenticate = (req, res, next) => {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token || token !== process.env.API_TEST_TOKEN) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Missing or invalid token' });
  }
  next();
};

// === Fetch Data from ServiceNow ===
const fetchFromServiceNow = async (table, sys_id = null, queryParams = {}) => {
  try {
    const baseUrl = `${SERVICE_NOW_CONFIG.baseUrl}api/now/table/${table}`;
    const auth = {
      username: SERVICE_NOW_CONFIG.username,
      password: SERVICE_NOW_CONFIG.password,
    };
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const params = sys_id ? {} : {
      sysparm_limit: 1000,
      sysparm_offset: 0,
      sysparm_display_value: true,
      ...queryParams
    };

    if (sys_id) {
      const res = await axios.get(`${baseUrl}/${sys_id}`, { auth, headers });
      return res.data.result;
    }

    let results = [];
    let response = await axios.get(baseUrl, { auth, headers, params });
    results = response.data.result;

    while (response.data.result.length === 1000) {
      params.sysparm_offset += 1000;
      response = await axios.get(baseUrl, { auth, headers, params });
      results = results.concat(response.data.result);
    }

    return results;
  } catch (err) {
    console.error(`ServiceNow API error for table ${table}:`, err?.response?.data || err.message);
    throw new Error(`ServiceNow API error: ${err.message}`);
  }
};

// === Helper Functions ===
const parsePrice = (str) => {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

const parseBoolStr = (str) => {
  if (typeof str === 'boolean') return str ? 1 : 0;
  if (!str) return 0;
  return str.toString().toLowerCase() === 'true' ? 1 : 0;
};

const parseContractTerm = (str) => {
  if (!str) return 12;
  const lowerStr = str.toString().toLowerCase();
  if (lowerStr.includes('month')) return 1;
  if (lowerStr.includes('year')) return 12;
  return 12;
};

const parseDateToDays = (dateStr) => {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  return isNaN(date) ? 0 : Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
};

// === Product Training ===
async function buildProductTrainingData(products) {
  const trainingData = products.map(p => ({
    contractTerm: parseContractTerm(p.contract_term),
    sellable: parseBoolStr(p.sellable),
    nrc: parsePrice(p.nrc),
    mrc: parsePrice(p.mrc),
    deviceCount: parseInt((p.short_description || '').match(/\d+/)?.[0]) || 1,
    isActive: parseBoolStr(p.active),
    isBundle: parseBoolStr(p.is_bundle),
    // Add more product features as needed
  })).filter(p => p.mrc > 0); // Filter out invalid products

  return {
    trainingData,
    sampleProducts: products.slice(0, 2).map(p => ({
      id: p.sys_id,
      name: p.short_description,
      features: {
        contractTerm: parseContractTerm(p.contract_term),
        sellable: parseBoolStr(p.sellable),
        nrc: parsePrice(p.nrc),
        mrc: parsePrice(p.mrc),
        deviceCount: parseInt((p.short_description || '').match(/\d+/)?.[0]) || 1,
        isActive: parseBoolStr(p.active),
        isBundle: parseBoolStr(p.is_bundle),
      }
    }))
  };
}

// === Opportunity Training ===
async function buildOpportunityTrainingData(opps) {
  const trainingData = opps.map(o => ({
    amount: parsePrice(o.amount),
    probability: parseFloat(o.probability) || 0,
    closeMonth: o.close_date ? new Date(o.close_date).getMonth() + 1 : 0,
    stage: o.stage === 'Closed Won' ? 1 : (o.stage === 'Closed Lost' ? -1 : 0),
    // Add more opportunity features as needed
  })).filter(o => o.amount > 0); // Filter out invalid opportunities

  return {
    trainingData,
    sampleOpportunities: opps.slice(0, 2).map(o => ({
      id: o.sys_id,
      name: o.short_description,
      features: {
        amount: parsePrice(o.amount),
        probability: parseFloat(o.probability) || 0,
        closeMonth: o.close_date ? new Date(o.close_date).getMonth() + 1 : 0,
        stage: o.stage === 'Closed Won' ? 1 : (o.stage === 'Closed Lost' ? -1 : 0),
      }
    }))
  };
}

// === Quote Training ===
async function buildQuoteTrainingData(quotes) {
  const trainingData = quotes.map(q => ({
    totalPrice: parsePrice(q.total_price),
    discount: parsePrice(q.discount),
    status: q.status === 'Accepted' ? 1 : (q.status === 'Rejected' ? -1 : 0),
    validUntilDays: parseDateToDays(q.valid_until),
    // Add more quote features as needed
  })).filter(q => q.totalPrice > 0); // Filter out invalid quotes

  return {
    trainingData,
    sampleQuotes: quotes.slice(0, 2).map(q => ({
      id: q.sys_id,
      name: q.number,
      features: {
        totalPrice: parsePrice(q.total_price),
        discount: parsePrice(q.discount),
        status: q.status === 'Accepted' ? 1 : (q.status === 'Rejected' ? -1 : 0),
        validUntilDays: parseDateToDays(q.valid_until),
      }
    }))
  };
}

// === Product Spec Training ===
async function buildProductSpecTrainingData(specs) {
  const trainingData = specs.map(s => ({
    isInstallationRequired: parseBoolStr(s.is_installation_required),
    isComposite: parseBoolStr(s.is_composite),
    isLocationSpecific: parseBoolStr(s.is_location_specific),
    daysActive: parseDateToDays(s.start_date),
    // Add more spec features as needed
  })).filter(s => s.daysActive > 0); // Filter out invalid specs

  return {
    trainingData,
    sampleSpecs: specs.slice(0, 2).map(s => ({
      id: s.sys_id,
      name: s.name,
      features: {
        isInstallationRequired: parseBoolStr(s.is_installation_required),
        isComposite: parseBoolStr(s.is_composite),
        isLocationSpecific: parseBoolStr(s.is_location_specific),
        daysActive: parseDateToDays(s.start_date),
      }
    }))
  };
}

// === Category Training ===
async function buildCategoryTrainingData(categories) {
  const trainingData = categories.map(c => ({
    isLeaf: parseBoolStr(c.is_leaf),
    status: c.status === 'Published' ? 1 : 0,
    daysActive: parseDateToDays(c.start_date),
    // Add more category features as needed
  }));

  return {
    trainingData,
    sampleCategories: categories.slice(0, 2).map(c => ({
      id: c.sys_id,
      name: c.name,
      features: {
        isLeaf: parseBoolStr(c.is_leaf),
        status: c.status === 'Published' ? 1 : 0,
        daysActive: parseDateToDays(c.start_date),
      }
    }))
  };
}

// === Catalog Training ===
async function buildCatalogTrainingData(catalogs) {
  const trainingData = catalogs.map(c => ({
    isDefault: parseBoolStr(c.is_default),
    status: c.status === 'Published' ? 1 : 0,
    daysActive: parseDateToDays(c.start_date),
    leafCategoriesCount: (c.leaf_categories || '').split(',').filter(Boolean).length,
    // Add more catalog features as needed
  }));

  return {
    trainingData,
    sampleCatalogs: catalogs.slice(0, 2).map(c => ({
      id: c.sys_id,
      name: c.name,
      features: {
        isDefault: parseBoolStr(c.is_default),
        status: c.status === 'Published' ? 1 : 0,
        daysActive: parseDateToDays(c.start_date),
        leafCategoriesCount: (c.leaf_categories || '').split(',').filter(Boolean).length,
      }
    }))
  };
}

// === Convert to Tensors ===
function convertToTensors(data, featureKeys) {
  if (!data || data.length === 0) {
    throw new Error('No valid data provided for tensor conversion');
  }

  const features = data.map(d => featureKeys.map(key => d[key]));
  return tf.tensor2d(features, [features.length, featureKeys.length]);
}

// === Product Training Route ===
router.post('/api/ai/train-products', async (req, res) => {
  try {
    console.log('Starting product training...');
    const products = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables.product_offering);
    
    const { trainingData, sampleProducts } = await buildProductTrainingData(products);

    if (trainingData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product data available',
        sampleProducts
      });
    }

    console.log(`Training with ${trainingData.length} product records`);
    
    const productFeatures = ['contractTerm', 'sellable', 'nrc', 'mrc', 'deviceCount', 'isActive', 'isBundle'];
    const featureTensor = convertToTensors(trainingData, productFeatures);
    
    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [productFeatures.length],
      units: 8,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 3 })); // Reduced dimension
    model.add(tf.layers.dense({ 
      units: productFeatures.length,
      activation: 'relu'
    }));

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    await model.fit(featureTensor, featureTensor, {
      epochs: 10,
      batchSize: 8,
      verbose: 0
    });

    trainedProductModel = model;

    const sampleTensor = convertToTensors(
      sampleProducts.map(p => p.features), 
      productFeatures
    );
    const embeddings = model.predict(sampleTensor.slice(0, 1));

    res.json({
      success: true,
      message: 'Product training complete',
      trainedSamples: trainingData.length,
      sampleProducts,
      sampleEmbedding: await embeddings.data(),
      featureDescription: {
        contractTerm: 'Contract duration in months',
        sellable: 'Is product sellable (0 or 1)',
        nrc: 'Non-recurring charge',
        mrc: 'Monthly recurring charge',
        deviceCount: 'Number of devices/nodes',
        isActive: 'Is product active (0 or 1)',
        isBundle: 'Is product a bundle (0 or 1)'
      }
    });
  } catch (err) {
    console.error('Product training error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Product training failed: ' + err.message 
    });
  }
});

// === Product Prediction Route ===
router.post('/api/ai/predict-product', async (req, res) => {
  try {
    if (!trainedProductModel) {
      return res.status(400).json({ success: false, message: 'Product model not trained yet. Please train the model first.' });
    }

    const input = req.body;

    const features = [
      parseContractTerm(input.contractTerm),
      parseBoolStr(input.sellable),
      parsePrice(input.nrc),
      parsePrice(input.mrc),
      parseInt(input.deviceCount) || 1,
      parseBoolStr(input.isActive),
      parseBoolStr(input.isBundle),
    ];

    const inputTensor = tf.tensor2d([features]);
    const prediction = trainedProductModel.predict(inputTensor);
    const predictedFeatures = await prediction.data();

    res.json({
      success: true,
      message: 'Product prediction completed',
      inputFeatures: features,
      predictedOutput: Array.from(predictedFeatures)
    });
  } catch (err) {
    console.error('Product prediction error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// === Opportunity Training Route ===
router.post('/api/ai/train-opportunities', async (req, res) => {
  try {
    console.log('Starting opportunity training...');
    const opps = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables.opportunity);
    
    const { trainingData, sampleOpportunities } = await buildOpportunityTrainingData(opps);

    if (trainingData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid opportunity data available',
        sampleOpportunities
      });
    }

    console.log(`Training with ${trainingData.length} opportunity records`);
    
    const oppFeatures = ['amount', 'probability', 'closeMonth', 'stage'];
    const featureTensor = convertToTensors(trainingData, oppFeatures);
    const targetTensor = tf.tensor1d(trainingData.map(o => o.probability));

    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [oppFeatures.length],
      units: 8,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    const history = await model.fit(featureTensor, targetTensor, {
      epochs: 10,
      batchSize: 4,
      validationSplit: 0.2,
      verbose: 0
    });

    trainedOpportunityModel = model;

    const example = featureTensor.mean(0).reshape([1, oppFeatures.length]);
    const prediction = model.predict(example);

    res.json({
      success: true,
      message: 'Opportunity training complete',
      trainedSamples: trainingData.length,
      sampleOpportunities,
      examplePrediction: (await prediction.data())[0].toFixed(4),
      featureDescription: {
        amount: 'Opportunity amount (USD)',
        probability: 'Current probability (0-1)',
        closeMonth: 'Month when opportunity will close (1-12)',
        stage: 'Stage (-1 for Lost, 0 for Open, 1 for Won)'
      },
      finalLoss: history.history.loss[history.history.loss.length - 1].toFixed(4)
    });
  } catch (err) {
    console.error('Opportunity training error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Opportunity training failed: ' + err.message 
    });
  }
});

// === Quote Training Route ===
router.post('/api/ai/train-quotes', async (req, res) => {
  try {
    console.log('Starting quote training...');
    const quotes = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables.quote);
    
    const { trainingData, sampleQuotes } = await buildQuoteTrainingData(quotes);

    if (trainingData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid quote data available',
        sampleQuotes
      });
    }

    console.log(`Training with ${trainingData.length} quote records`);
    
    const quoteFeatures = ['totalPrice', 'discount', 'status', 'validUntilDays'];
    const featureTensor = convertToTensors(trainingData, quoteFeatures);
    const targetTensor = tf.tensor1d(trainingData.map(q => q.status));

    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [quoteFeatures.length],
      units: 8,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    const history = await model.fit(featureTensor, targetTensor, {
      epochs: 10,
      batchSize: 4,
      validationSplit: 0.2,
      verbose: 0
    });

    trainedQuoteModel = model;

    const example = featureTensor.mean(0).reshape([1, quoteFeatures.length]);
    const prediction = model.predict(example);

    res.json({
      success: true,
      message: 'Quote training complete',
      trainedSamples: trainingData.length,
      sampleQuotes,
      examplePrediction: (await prediction.data())[0].toFixed(4),
      featureDescription: {
        totalPrice: 'Total quote price (USD)',
        discount: 'Discount amount (USD)',
        status: 'Status (-1 for Rejected, 0 for Pending, 1 for Accepted)',
        validUntilDays: 'Days until quote expires'
      },
      finalAccuracy: history.history.acc[history.history.acc.length - 1].toFixed(4)
    });
  } catch (err) {
    console.error('Quote training error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Quote training failed: ' + err.message 
    });
  }
});

// === Quote Prediction Route ===
router.post('/api/ai/predict-quote', async (req, res) => {
  try {
    if (!trainedQuoteModel) {
      return res.status(400).json({ success: false, message: 'Quote model not trained yet. Please train the model first.' });
    }

    const input = req.body;

    const features = [
      parsePrice(input.totalPrice),
      parsePrice(input.discount),
      input.status === 'Accepted' ? 1 : (input.status === 'Rejected' ? -1 : 0),
      parseDateToDays(input.validUntil),
    ];

    const inputTensor = tf.tensor2d([features]);
    const prediction = trainedQuoteModel.predict(inputTensor);
    const predictedStatus = (await prediction.data())[0];

    res.json({
      success: true,
      message: 'Quote prediction completed',
      inputFeatures: features,
      predictedStatus: predictedStatus.toFixed(4),
      interpretation: predictedStatus > 0.6 ? 'Likely Accepted' : 
                    predictedStatus < 0.4 ? 'Likely Rejected' : 'Uncertain'
    });
  } catch (err) {
    console.error('Quote prediction error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// === Product Spec Training Route ===
router.post('/api/ai/train-product-specs', async (req, res) => {
  try {
    console.log('Starting product spec training...');
    const specs = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables.product_spec);
    
    const { trainingData, sampleSpecs } = await buildProductSpecTrainingData(specs);

    if (trainingData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid product spec data available',
        sampleSpecs
      });
    }

    console.log(`Training with ${trainingData.length} product spec records`);
    
    const specFeatures = ['isInstallationRequired', 'isComposite', 'isLocationSpecific', 'daysActive'];
    const featureTensor = convertToTensors(trainingData, specFeatures);
    
    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [specFeatures.length],
      units: 6,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 2 })); // Reduced dimension
    model.add(tf.layers.dense({ 
      units: specFeatures.length,
      activation: 'relu'
    }));

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    await model.fit(featureTensor, featureTensor, {
      epochs: 10,
      batchSize: 8,
      verbose: 0
    });

    trainedProductSpecModel = model;

    const sampleTensor = convertToTensors(
      sampleSpecs.map(s => s.features), 
      specFeatures
    );
    const embeddings = model.predict(sampleTensor.slice(0, 1));

    res.json({
      success: true,
      message: 'Product spec training complete',
      trainedSamples: trainingData.length,
      sampleSpecs,
      sampleEmbedding: await embeddings.data(),
      featureDescription: {
        isInstallationRequired: 'Requires installation (0 or 1)',
        isComposite: 'Is composite product (0 or 1)',
        isLocationSpecific: 'Is location specific (0 or 1)',
        daysActive: 'Days since product spec was active'
      }
    });
  } catch (err) {
    console.error('Product spec training error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Product spec training failed: ' + err.message 
    });
  }
});

// === Product Spec Prediction Route ===
router.post('/api/ai/predict-product-spec', async (req, res) => {
  try {
    if (!trainedProductSpecModel) {
      return res.status(400).json({ success: false, message: 'Product spec model not trained yet. Please train the model first.' });
    }

    const input = req.body;

    const features = [
      parseBoolStr(input.isInstallationRequired),
      parseBoolStr(input.isComposite),
      parseBoolStr(input.isLocationSpecific),
      parseDateToDays(input.startDate),
    ];

    const inputTensor = tf.tensor2d([features]);
    const prediction = trainedProductSpecModel.predict(inputTensor);
    const predictedFeatures = await prediction.data();

    res.json({
      success: true,
      message: 'Product spec prediction completed',
      inputFeatures: features,
      predictedOutput: Array.from(predictedFeatures)
    });
  } catch (err) {
    console.error('Product spec prediction error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// === Category Training Route ===
router.post('/api/ai/train-categories', async (req, res) => {
  try {
    console.log('Starting category training...');
    const categories = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables.offering_category);
    
    const { trainingData, sampleCategories } = await buildCategoryTrainingData(categories);

    if (trainingData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid category data available',
        sampleCategories
      });
    }

    console.log(`Training with ${trainingData.length} category records`);
    
    const categoryFeatures = ['isLeaf', 'status', 'daysActive'];
    const featureTensor = convertToTensors(trainingData, categoryFeatures);
    
    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [categoryFeatures.length],
      units: 4,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 1 })); // Reduced dimension
    model.add(tf.layers.dense({ 
      units: categoryFeatures.length,
      activation: 'relu'
    }));

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    await model.fit(featureTensor, featureTensor, {
      epochs: 10,
      batchSize: 8,
      verbose: 0
    });

    trainedCategoryModel = model;

    const sampleTensor = convertToTensors(
      sampleCategories.map(c => c.features), 
      categoryFeatures
    );
    const embeddings = model.predict(sampleTensor.slice(0, 1));

    res.json({
      success: true,
      message: 'Category training complete',
      trainedSamples: trainingData.length,
      sampleCategories,
      sampleEmbedding: await embeddings.data(),
      featureDescription: {
        isLeaf: 'Is leaf category (0 or 1)',
        status: 'Published status (0 or 1)',
        daysActive: 'Days since category was active'
      }
    });
  } catch (err) {
    console.error('Category training error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Category training failed: ' + err.message 
    });
  }
});

// === Catalog Training Route ===
router.post('/api/ai/train-catalogs', async (req, res) => {
  try {
    console.log('Starting catalog training...');
    const catalogs = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables.offering_catalog);
    
    const { trainingData, sampleCatalogs } = await buildCatalogTrainingData(catalogs);

    if (trainingData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid catalog data available',
        sampleCatalogs
      });
    }

    console.log(`Training with ${trainingData.length} catalog records`);
    
    const catalogFeatures = ['isDefault', 'status', 'daysActive', 'leafCategoriesCount'];
    const featureTensor = convertToTensors(trainingData, catalogFeatures);
    
    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [catalogFeatures.length],
      units: 6,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 2 })); // Reduced dimension
    model.add(tf.layers.dense({ 
      units: catalogFeatures.length,
      activation: 'relu'
    }));

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    await model.fit(featureTensor, featureTensor, {
      epochs: 10,
      batchSize: 8,
      verbose: 0
    });

    trainedCatalogModel = model;

    const sampleTensor = convertToTensors(
      sampleCatalogs.map(c => c.features), 
      catalogFeatures
    );
    const embeddings = model.predict(sampleTensor.slice(0, 1));

    res.json({
      success: true,
      message: 'Catalog training complete',
      trainedSamples: trainingData.length,
      sampleCatalogs,
      sampleEmbedding: await embeddings.data(),
      featureDescription: {
        isDefault: 'Is default catalog (0 or 1)',
        status: 'Published status (0 or 1)',
        daysActive: 'Days since catalog was active',
        leafCategoriesCount: 'Number of leaf categories in catalog'
      }
    });
  } catch (err) {
    console.error('Catalog training error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Catalog training failed: ' + err.message 
    });
  }
});

// === Auto CRUD Route Creator ===
const createTableRoutes = (tableKey, path) => {
  router.get(`/api/${path}`, async (req, res) => {
    try {
      const records = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables[tableKey]);
      res.json({ success: true, count: records.length, data: records });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get(`/api/${path}/:sys_id`, async (req, res) => {
    try {
      const record = await fetchFromServiceNow(SERVICE_NOW_CONFIG.tables[tableKey], req.params.sys_id);
      res.json({ success: true, data: record });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
};

// Register routes
createTableRoutes('product_offering', 'products');
createTableRoutes('product_spec', 'product-specs');
createTableRoutes('offering_category', 'categories');
createTableRoutes('offering_catalog', 'catalogs');
createTableRoutes('quote', 'quotes');
createTableRoutes('opportunity', 'opportunities');

module.exports = router;