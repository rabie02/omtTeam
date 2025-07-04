import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import {
  Button, Spin, Alert, Progress, Card, Tag, Divider, Typography, Space,
  Row, Col, Tabs, Badge, Tooltip, Collapse, Statistic, Result,
  Descriptions, List, Timeline, Modal, notification 
} from 'antd';
import {
  Cpu, Zap, Package, TrendingUp, CheckCircle, Activity, FileText,
  Layers, ShoppingCart, Box, Folder, BarChart2, Database,
  Settings, Terminal, HelpCircle, XCircle, Clock, Info, Cloud
} from 'lucide-react';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// Custom notification function to replace alert/window.alert
const openNotificationWithIcon = (type, message, description) => {
  notification[type]({
    message: message,
    description: description,
    placement: 'topRight',
  });
};

const AIModelTraining = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [training, setTraining] = useState({
    products: false,
    opportunities: false,
    quotes: false,
    productSpecs: false,
    categories: false,
    catalogs: false
  });
  const [progress, setProgress] = useState({
    products: 0,
    opportunities: 0,
    quotes: 0,
    productSpecs: 0,
    categories: 0,
    catalogs: 0
  });
  const [results, setResults] = useState({
    products: null,
    opportunities: null,
    quotes: null,
    productSpecs: null,
    categories: null,
    catalogs: null
  });
  const [error, setError] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [trainingHistory, setTrainingHistory] = useState([]); // New state for history

  // Simulate initial data load and populate some history
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalLoading(false);
      // Simulate some pre-existing training history
      setTrainingHistory([
        {
          id: 'hist-001', modelType: 'products', status: 'success',
          trainedSamples: 11200, finalLoss: 0.0312, duration: '4m 30s',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: 'hist-002', modelType: 'opportunities', status: 'failed',
          trainedSamples: 8500, finalLoss: 'N/A', duration: '3m 55s',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
          errorMessage: 'Data normalization error'
        },
      ]);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const trainModel = useCallback(async (modelType) => {
    setTraining(prev => ({ ...prev, [modelType]: true }));
    setProgress(prev => ({ ...prev, [modelType]: 0 }));
    setError(null);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 5;
      setProgress(prev => ({ ...prev, [modelType]: Math.min(currentProgress, 100) }));
    }, 700);

    const startTime = Date.now();
    let success = false;
    let responseData = null;
    let errorMessage = null;

    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const endpointModelType = modelType === 'productSpecs' ? 'product-specs' : modelType;
      const endpoint = `http://localhost:3000/api/ai/train-${endpointModelType}`;

      // Simulate API call with a delay and random success/failure
      const response = await new Promise((resolve, reject) => {
        setTimeout(() => {
          const simulatedSuccess = Math.random() > 0.1; // 90% success rate
          if (simulatedSuccess) {
            resolve({
              data: {
                success: true,
                trainedSamples: Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000,
                finalLoss: parseFloat((Math.random() * 0.1).toFixed(4)),
                sampleProducts: modelType === 'products' ? [{
                  name: "Quantum Leap Widget",
                  features: { mrc: 75.99, nrc: 120, deviceCount: 8, contractTerm: 24, isNew: true, supportLevel: 'Premium' }
                }, {
                  name: "Evolve-X Service Pack",
                  features: { mrc: 19.99, nrc: 0, deviceCount: 1, contractTerm: 12, isNew: false, supportLevel: 'Standard' }
                }] : undefined,
                sampleOpportunities: modelType === 'opportunities' ? [{
                  name: "Enterprise Cloud Deal",
                  number: 'OPP-001',
                  features: { amount: 150000, probability: 0.85, closeDate: '2025-07-30', stage: 'Negotiation', customerSize: 'Enterprise' }
                }] : undefined,
                sampleQuotes: modelType === 'quotes' ? [{
                  name: "Software License Renewal",
                  number: 'QTE-005',
                  features: { totalPrice: 25000, discount: 0.1, validityPeriod: 30, hasTrial: true, approvalStatus: 'Pending' }
                }] : undefined,
                sampleSpecs: modelType === 'productSpecs' ? [{
                  name: "Advanced Sensor Module",
                  number: 'PS-101',
                  features: { installationRequired: true, compositeStatus: false, powerConsumption: 'Low', formFactor: 'Compact' }
                }] : undefined,
                sampleCategories: modelType === 'categories' ? [{
                  name: "Smart Home Devices",
                  number: 'CAT-003',
                  features: { isLeaf: true, publicationDate: '2024-01-15', numberOfProducts: 50, parentCategory: 'Electronics' }
                }] : undefined,
                sampleCatalogs: modelType === 'catalogs' ? [{
                  name: "Summer Sale Catalog",
                  number: 'CTLG-002',
                  features: { isDefault: false, categoryCount: 15, productCount: 200, lastUpdated: '2025-05-01' }
                }] : undefined,
                featureDescription: {
                  mrc: "Monthly Recurring Charge", nrc: "Non-Recurring Charge", deviceCount: "Number of Devices", contractTerm: "Contract Term (Months)", isNew: "Is New Product", supportLevel: "Support Level",
                  amount: "Opportunity Amount", probability: "Probability (%)", closeDate: "Expected Close Date", stage: "Sales Stage", customerSize: "Customer Size",
                  totalPrice: "Total Quoted Price", discount: "Discount Applied", validityPeriod: "Validity (Days)", hasTrial: "Trial Offered", approvalStatus: "Approval Status",
                  installationRequired: "Installation Required", compositeStatus: "Is Composite Product", powerConsumption: "Power Consumption", formFactor: "Form Factor",
                  isLeaf: "Is Leaf Category", publicationDate: "Publication Date", numberOfProducts: "Number of Products", parentCategory: "Parent Category",
                  isDefault: "Is Default Catalog", categoryCount: "Category Count", productCount: "Product Count", lastUpdated: "Last Updated"
                },
                examplePrediction: parseFloat((Math.random()).toFixed(2)),
                sampleEmbedding: Array.from({ length: 10 }, () => parseFloat(Math.random().toFixed(4)))
              }
            });
          } else {
            reject({
              response: {
                data: {
                  message: `Simulated error: Failed to connect to ${endpointModelType} data source.`
                }
              },
              message: `Network error or API failure for ${endpointModelType}.`
            });
          }
        }, 3000 + Math.random() * 2000); // 3-5 second simulated API call
      });

      // const response = await axios.post(endpoint, {}, { headers }); // Uncomment for real API call

      clearInterval(interval);
      setProgress(prev => ({ ...prev, [modelType]: 100 }));

      if (response.data.success) {
        success = true;
        responseData = response.data;
        setResults(prev => ({ ...prev, [modelType]: response.data }));
        openNotificationWithIcon('success', 'Training Complete!', `${titleCase(modelType)} model trained successfully.`);
      } else {
        errorMessage = response.data.message || `${modelType} training failed`;
        setError(errorMessage);
        setResults(prev => ({ ...prev, [modelType]: { success: false, errorMessage: errorMessage } }));
        openNotificationWithIcon('error', 'Training Failed!', `${titleCase(modelType)} model training encountered an issue.`);
      }
    } catch (err) {
      clearInterval(interval);
      setProgress(prev => ({ ...prev, [modelType]: Math.max(progress[modelType], 0) })); // Fixed: Changed prog to progress
      errorMessage = err.response?.data?.message || `Unexpected ${modelType} training error: ${err.message}`;
      setError(errorMessage);
      setResults(prev => ({ ...prev, [modelType]: { success: false, errorMessage: errorMessage } }));
      openNotificationWithIcon('error', 'Training Failed!', `${titleCase(modelType)} model training encountered an unexpected error.`);
    } finally {
      setTraining(prev => ({ ...prev, [modelType]: false }));
      const duration = Date.now() - startTime;
      const durationString = `${(duration / 1000 / 60).toFixed(0)}m ${((duration / 1000) % 60).toFixed(0)}s`;
      setTrainingHistory(prev => [
        {
          id: `hist-${Date.now()}`,
          modelType,
          status: success ? 'success' : 'failed',
          trainedSamples: responseData?.trainedSamples || (success ? Math.floor(Math.random() * 10000) + 1000 : 0),
          finalLoss: responseData?.finalLoss || (success ? parseFloat((Math.random() * 0.1).toFixed(4)) : 'N/A'),
          duration: durationString,
          timestamp: new Date().toLocaleString(),
          errorMessage: errorMessage
        },
        ...prev
      ].slice(0, 10)); // Keep last 10 entries
    }
  }, [progress, results]);

  const reset = useCallback((modelType) => {
    Modal.confirm({
      title: `Confirm Retrain ${titleCase(modelType)} Model?`,
      content: `Are you sure you want to reset and retrain the ${titleCase(modelType)} model? This will clear its current results.`,
      okText: 'Retrain',
      cancelText: 'Cancel',
      onOk() {
        setResults(prev => ({ ...prev, [modelType]: null }));
        setProgress(prev => ({ ...prev, [modelType]: 0 }));
        setError(null);
        openNotificationWithIcon('info', 'Resetting Model', `${titleCase(modelType)} model is being reset for retraining.`);
      },
      onCancel() {
        // Do nothing
      },
    });
  }, []);

  const titleCase = (str) => {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  };

  const renderModelCard = (modelType, icon, title, description) => {
    const isTraining = training[modelType];
    const result = results[modelType];
    const currentProgress = progress[modelType];
    const hasError = result && result.success === false;

    return (
      <Card
        className="mb-8 rounded-2xl shadow-xl transition-all duration-500 ease-in-out transform hover:scale-[1.01] bg-gradient-to-br from-white to-blue-50 border border-blue-100"
        headStyle={{ borderBottom: 'none', paddingBottom: 0 }}
        bodyStyle={{ paddingTop: 0 }}
        title={
          <Space align="center" className="py-4">
            {icon}
            <Title level={4} className="!mb-0 text-gray-800 font-semibold">{title}</Title>
            {isTraining && <Tag color="processing" className="rounded-full px-3 py-1 text-sm animate-pulse">Training in Progress</Tag>}
            {result && result.success && <Tag icon={<CheckCircle size={14} />} color="success" className="rounded-full px-3 py-1 text-sm">Trained Successfully</Tag>}
            {hasError && <Tag icon={<XCircle size={14} />} color="error" className="rounded-full px-3 py-1 text-sm">Training Failed</Tag>}
          </Space>
        }
        extra={
          <Space>
            {!isTraining && result && (
              <Tooltip title="Retrain this model">
                <Button
                  onClick={() => reset(modelType)}
                  icon={<Zap size={16} />}
                  danger
                  type="primary"
                  className="rounded-lg shadow-sm"
                >
                  Retrain Model
                </Button>
              </Tooltip>
            )}
            {!result && (
              <Button
                type="primary"
                onClick={() => trainModel(modelType)}
                disabled={isTraining}
                icon={<Zap size={16} />}
                loading={isTraining}
                size="large"
                className="rounded-lg shadow-md bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 border-none"
              >
                {isTraining ? 'Initiating Training...' : 'Start Training'}
              </Button>
            )}
          </Space>
        }
      >
        {isTraining && (
          <div className="text-center py-8 bg-blue-50 rounded-lg flex flex-col items-center justify-center space-y-4">
            <Progress
              type="circle"
              percent={currentProgress}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              width={120}
              format={percent => (
                <div className="flex flex-col items-center justify-center">
                  <Spin size="large" className="mb-2" />
                  <Text strong className="text-lg text-blue-700">{`${percent}%`}</Text>
                </div>
              )}
            />
            <Text type="secondary" className="block text-xl font-medium text-gray-700">
              Analyzing & Training on {titleCase(modelType)} Data...
            </Text>
            <Paragraph className="text-gray-500 text-sm">
              This process may take a few minutes depending on data complexity.
            </Paragraph>
          </div>
        )}

        {!isTraining && !result && (
          <Paragraph type="secondary" className="text-lg leading-relaxed text-gray-600 pt-2">
            {description}
          </Paragraph>
        )}

        {result && result.success && (
          <div className="space-y-6 pt-4">
            <Alert
              message="Model Training Complete"
              description={<>The AI model for <Text strong>{title}</Text> has been successfully trained and is ready for use. Further details below.</>}
              type="success"
              showIcon
              action={
                <Button size="small" type="link" onClick={() => setActiveTab('model-dashboard')}>
                  View Global Dashboard
                </Button>
              }
              className="rounded-lg shadow-md"
            />

            <Descriptions
              bordered
              column={{ xs: 1, sm: 2, md: 3 }}
              size="middle"
              className="rounded-lg overflow-hidden border border-gray-200"
            >
              <Descriptions.Item label={<Text strong><Database size={16} className="inline mr-2 text-blue-500" />Trained Samples</Text>}>
                <Text className="text-lg text-gray-800">{result.trainedSamples?.toLocaleString() || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong><Activity size={16} className="inline mr-2 text-green-500" />Model Loss</Text>}>
                <Text className={`text-lg ${result.finalLoss < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.finalLoss?.toFixed(4) || 'N/A'}
                </Text>
                <Tooltip title="Lower values indicate a better fit to the training data.">
                  <Info size={14} className="ml-2 text-gray-400" />
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label={<Text strong><Clock size={16} className="inline mr-2 text-orange-500" />Training Duration</Text>}>
                <Text className="text-lg text-gray-800">
                  {`${(Math.random() * 5 + 1).toFixed(1)} minutes`}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" className="!my-6 text-2xl font-semibold text-gray-700">
              <Text strong className="text-xl">Sample Data Analysis</Text>
            </Divider>
            <Row gutter={[24, 24]}>
              {(result.sampleProducts || result.sampleOpportunities ||
                result.sampleQuotes || result.sampleSpecs ||
                result.sampleCategories || result.sampleCatalogs || []).slice(0, 2).map((item, index) => (
                  <Col xs={24} md={12} key={index}>
                    <Card
                      size="small"
                      title={<Text strong className="text-base text-indigo-700">{item.name || `Sample ${titleCase(modelType).slice(0, -1)} Data ${item.number || (index + 1)}`}</Text>}
                      className="bg-purple-50 border-purple-200 rounded-xl shadow-inner"
                      headStyle={{ borderBottom: '1px solid #dcdcdc' }}
                    >
                      <Descriptions column={1} size="small">
                        {Object.entries(item.features || {}).map(([key, value]) => (
                          <Descriptions.Item
                            key={key}
                            label={<Text type="secondary" className="text-sm font-medium">{result.featureDescription?.[key] || titleCase(key)}</Text>}
                            labelStyle={{ color: '#666' }}
                          >
                            <Text strong className="text-sm text-gray-800">
                              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                                ['mrc', 'nrc', 'amount', 'totalPrice', 'discount'].includes(key) ? `$${value}` :
                                  key === 'probability' ? `${(value * 100).toFixed(1)}%` : value}
                            </Text>
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    </Card>
                  </Col>
                ))}
            </Row>

            <Divider orientation="left" className="!my-6 text-2xl font-semibold text-gray-700">
              <Text strong className="text-xl">Model Insights & Predictions</Text>
            </Divider>
            <Collapse
              bordered={false}
              expandIconPosition="right"
              className="bg-white rounded-lg shadow-inner"
              expandIcon={({ isActive }) => <Info size={18} rotate={isActive ? 90 : 0} />}
            >
              <Panel
                header={<Text strong className="text-base flex items-center text-gray-800"><BarChart2 size={18} className="mr-3 text-red-500" /> Feature Importance</Text>}
                key="1"
                className="bg-gray-50 rounded-xl mb-2"
              >
                <Paragraph type="secondary" className="text-base">
                  Understanding which features had the most significant impact on the model's predictions. Features with higher importance values had a greater influence on the model's output.
                </Paragraph>
                <div className="space-y-4 pt-2">
                  {Object.entries(result.featureDescription || {}).map(([key, desc]) => (
                    <div key={key} className="flex items-center gap-4">
                      <Text className="w-56 text-base font-medium text-gray-700">{desc}:</Text>
                      <Progress
                        percent={Math.floor(Math.random() * 30) + 60}
                        status="active"
                        showInfo={false}
                        strokeColor={
                          modelType === 'products' ? '#722ed1' :
                            modelType === 'opportunities' ? '#389e0d' :
                              modelType === 'quotes' ? '#1890ff' :
                                modelType === 'productSpecs' ? '#fa8c16' :
                                  modelType === 'categories' ? '#13c2c2' : '#f5222d'
                        }
                        className="flex-grow"
                      />
                      <Text strong className="text-base text-gray-800 w-12 text-right">{(Math.floor(Math.random() * 30) + 60)}%</Text>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel
                header={<Text strong className="text-base flex items-center text-gray-800"><Activity size={18} className="mr-3 text-blue-500" /> Model Prediction & Embedding</Text>}
                key="2"
                className="bg-gray-50 rounded-xl"
              >
                <Paragraph type="secondary" className="text-base">
                  An example prediction based on average data inputs for this model type, along with its numerical embedding.
                </Paragraph>
                <Card size="small" className="bg-blue-100 border-blue-300 rounded-xl shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <Text className="block mb-2 md:mb-0 text-lg font-medium text-gray-700">
                      Prediction for typical {titleCase(modelType).replace('Spec', 'Specification')}:
                    </Text>
                    <Tag
                      color={
                        result.examplePrediction > 0.7 ? 'green' :
                          result.examplePrediction > 0.3 ? 'orange' : 'red'
                      }
                      className="text-xl px-4 py-2 rounded-full font-semibold min-w-[100px] text-center"
                    >
                      {result.examplePrediction ?
                        `${(result.examplePrediction * 100).toFixed(1)}%` :
                        'N/A'}
                    </Tag>
                  </div>
                  {result.sampleEmbedding && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <Text strong className="block mb-2 text-base text-gray-700">Sample Embedding Vector:</Text>
                      <Tooltip title="A high-dimensional numerical representation of the input data, capturing its semantic meaning and relationships for the AI model.">
                        <Paragraph
                          copyable={{ tooltips: ['Copy embedding', 'Copied!'] }}
                          className="bg-gray-200 p-3 rounded-md text-sm whitespace-pre-wrap overflow-x-auto font-mono text-gray-800 shadow-inner"
                        >
                          {JSON.stringify(result.sampleEmbedding.slice(0, 5))}... ({result.sampleEmbedding.length} values)
                        </Paragraph>
                      </Tooltip>
                    </div>
                  )}
                </Card>
              </Panel>
            </Collapse>
          </div>
        )}

        {hasError && (
          <Alert
            message="Training Failed"
            description={
              <Paragraph className="text-base">
                An error occurred during {titleCase(modelType)} model training:
                <Text code className="block mt-2 bg-gray-100 p-2 rounded-md whitespace-pre-wrap">
                  {result.errorMessage || `Unknown error. Please check server logs.`}
                </Text>
                <Button type="link" onClick={() => reset(modelType)} className="mt-3 !px-0">
                  Try Retraining <span aria-hidden="true">&rarr;</span>
                </Button>
              </Paragraph>
            }
            type="error"
            showIcon
            className="mt-6 rounded-lg shadow-md"
            closable
            onClose={() => reset(modelType)}
          />
        )}
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12">
        {globalLoading && (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <Spin size="large" />
            <Paragraph className="mt-6 text-xl text-gray-600 animate-pulse">Loading AI system modules...</Paragraph>
            <Paragraph className="text-gray-500 text-base">Preparing your advanced insights dashboard.</Paragraph>
          </div>
        )}

        {!globalLoading && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            className="ai-training-tabs custom-tabs"
            tabBarExtraContent={
              <Tooltip title="Global Platform Settings">
                
              </Tooltip>
            }
          >
            {/* Overview Tab */}
            <TabPane
              key="overview"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Activity size={20} className="mr-3 text-purple-600" />
                  <span className="font-medium">Overview</span>
                </span>
              }
            >
              <div className="py-6 space-y-8">
                <Title level={3} className="text-gray-800 font-bold leading-tight">
                  Empower Your Business with Predictive AI
                </Title>
                <Paragraph className="text-lg leading-relaxed text-gray-700 mb-8 max-w-3xl">
                  This sophisticated dashboard provides a centralized platform to train, deploy, and monitor specialized AI models. Each model is engineered to transform raw data into actionable intelligence, driving smarter decisions across your enterprise.
                </Paragraph>

                <Row gutter={[32, 32]}>
                  <Col xs={24} md={12} lg={8}>
                    <Card className="rounded-2xl shadow-xl border border-blue-100 bg-blue-50" hoverable>
                      <Statistic
                        title={<Text strong className="text-blue-700 text-lg">Models Trained</Text>}
                        value={Object.values(results).filter(r => r && r.success).length}
                        suffix={` / ${Object.keys(training).length}`}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<CheckCircle size={24} className="text-green-500" />}
                      />
                      <Paragraph type="secondary" className="mt-3 text-base">Total AI models successfully brought online.</Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Card className="rounded-2xl shadow-xl border border-orange-100 bg-orange-50" hoverable>
                      <Statistic
                        title={<Text strong className="text-orange-700 text-lg">Models Awaiting Training</Text>}
                        value={Object.keys(training).filter(key => !results[key]).length}
                        valueStyle={{ color: '#faad14' }}
                        prefix={<Clock size={24} className="text-orange-500" />}
                      />
                      <Paragraph type="secondary" className="mt-3 text-base">Models ready for their initial data training.</Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Card className="rounded-2xl shadow-xl border border-indigo-100 bg-indigo-50" hoverable>
                      <Statistic
                        title={<Text strong className="text-indigo-700 text-lg">Last System Activity</Text>}
                        value="Just now"
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<Activity size={24} className="text-indigo-500" />}
                      />
                      <Paragraph type="secondary" className="mt-3 text-base">Overview of the most recent dashboard interaction.</Paragraph>
                    </Card>
                  </Col>
                </Row>

                <Divider className="!my-12 border-t-2 border-indigo-100" />

                <Title level={4} className="text-gray-800 font-bold">Quick Actions & Guidance</Title>
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card className="rounded-xl border border-green-100 bg-green-50 shadow-sm" hoverable>
                      <Space direction="vertical" size="middle" className="w-full">
                        <Title level={5} className="!mb-0 text-green-700 flex items-center"><Zap size={18} className="mr-2" /> Start New Training</Title>
                        <Paragraph type="secondary" className="text-base">
                          Initiate the training process for any of your available AI models.
                        </Paragraph>
                        <Button type="primary" size="large" onClick={() => setActiveTab('products')} icon={<Cpu size={20} />} className="rounded-lg shadow-md bg-green-600 hover:bg-green-700 border-none">
                          Begin Training Now
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card className="rounded-xl border border-purple-100 bg-purple-50 shadow-sm" hoverable>
                      <Space direction="vertical" size="middle" className="w-full">
                        <Title level={5} className="!mb-0 text-purple-700 flex items-center"><Database size={18} className="mr-2" /> Monitor Performance</Title>
                        <Paragraph type="secondary" className="text-base">
                          View detailed metrics and insights for all trained models.
                        </Paragraph>
                        <Button type="default" size="large" onClick={() => setActiveTab('model-dashboard')} icon={<BarChart2 size={20} />} className="rounded-lg shadow-md border-purple-300 text-purple-700 hover:bg-purple-100">
                          Go to Model Dashboard
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </div>
            </TabPane>

            {/* Individual Model Tabs */}
            <TabPane
              key="products"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Package size={20} className="mr-3 text-blue-600" />
                  <span className="font-medium">Products</span>
                  {results.products && <Badge status={results.products.success ? "success" : "error"} className="ml-2" />}
                </span>
              }
            >
              {renderModelCard(
                'products',
                <ShoppingCart size={24} className="text-blue-600" />,
                'Product Recommendation Model',
                'Train an AI model to intelligently recommend products to customers or sales teams based on historical data, product features like price, contract terms, device counts, and other relevant attributes. This model helps in up-selling and cross-selling.'
              )}
            </TabPane>

            <TabPane
              key="opportunities"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <TrendingUp size={20} className="mr-3 text-green-600" />
                  <span className="font-medium">Opportunities</span>
                  {results.opportunities && <Badge status={results.opportunities.success ? "success" : "error"} className="ml-2" />}
                </span>
              }
            >
              {renderModelCard(
                'opportunities',
                <BarChart2 size={24} className="text-green-600" />,
                'Opportunity Win-Loss Prediction Model',
                'Develop a model to predict the success or failure of sales opportunities. It leverages data points such as opportunity amount, probability of closure, close date, stage, and historical outcomes to provide actionable insights.'
              )}
            </TabPane>

            <TabPane
              key="quotes"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <FileText size={20} className="mr-3 text-cyan-600" />
                  <span className="font-medium">Quotes</span>
                  {results.quotes && <Badge status={results.quotes.success ? "success" : "error"} className="ml-2" />}
                </span>
              }
            >
              {renderModelCard(
                'quotes',
                <List size={24} className="text-cyan-600" />,
                'Quote Acceptance Prediction Model',
                'Train a model to forecast the likelihood of a quote being accepted by a client. Key factors include quoted price, applied discounts, payment terms, validity period, and historical quote conversion rates.'
              )}
            </TabPane>

            <TabPane
              key="productSpecs"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Box size={20} className="mr-3 text-orange-600" />
                  <span className="font-medium">Product Specs</span>
                  {results.productSpecs && <Badge status={results.productSpecs.success ? "success" : "error"} className="ml-2" />}
                </span>
              }
            >
              {renderModelCard(
                'productSpecs',
                <Box size={24} className="text-orange-600" />,
                'Product Specification Analysis Model',
                'Build a model to analyze and categorize product specifications. This can include understanding complex details like installation requirements, compatibility, composite status, and linking specifications to broader product families.'
              )}
            </TabPane>

            <TabPane
              key="categories"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Layers size={20} className="mr-3 text-teal-600" />
                  <span className="font-medium">Categories</span>
                  {results.categories && <Badge status={results.categories.success ? "success" : "error"} className="ml-2" />}
                </span>
              }
            >
              {renderModelCard(
                'categories',
                <Layers size={24} className="text-teal-600" />,
                'Product Category Classification Model',
                'Train a model to automatically classify products into appropriate categories. It analyzes product descriptions, attributes, "leaf status" (indicating if it\'s a final category), and publication dates to ensure accurate categorization.'
              )}
            </TabPane>

            <TabPane
              key="catalogs"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Folder size={20} className="mr-3 text-red-600" />
                  <span className="font-medium">Catalogs</span>
                  {results.catalogs && <Badge status={results.catalogs.success ? "success" : "error"} className="ml-2" />}
                </span>
              }
            >
              {renderModelCard(
                'catalogs',
                <Folder size={24} className="text-red-600" />,
                'Catalog Content Analysis Model',
                'Develop a model to analyze and optimize your product catalogs. This includes assessing their default status, evaluating the count of categories and products within each catalog, and identifying opportunities for content improvement.'
              )}
            </TabPane>

            {/* Model Dashboard Tab */}
            <TabPane
              key="model-dashboard"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Database size={20} className="mr-3 text-indigo-600" />
                  <span className="font-medium">Model Dashboard</span>
                </span>
              }
            >
              <div className="py-6 space-y-8">
                <Title level={3} className="text-gray-800 font-bold leading-tight">
                  Comprehensive Model Performance Overview
                </Title>
                <Paragraph className="text-lg leading-relaxed text-gray-700 mb-8 max-w-3xl">
                  Gain a holistic view of all trained AI models. Monitor their training status, key performance indicators (KPIs), and quickly identify areas requiring attention or further optimization.
                </Paragraph>

                <Row gutter={[32, 32]}>
                  {Object.keys(results).map(modelType => {
                    const result = results[modelType];
                    const isTrained = result && result.success;
                    const modelTitleMap = {
                      products: { title: 'Product Recommendations', icon: <ShoppingCart size={20} className="text-blue-600" /> },
                      opportunities: { title: 'Opportunity Prediction', icon: <BarChart2 size={20} className="text-green-600" /> },
                      quotes: { title: 'Quote Acceptance', icon: <FileText size={20} className="text-cyan-600" /> },
                      productSpecs: { title: 'Product Specifications', icon: <Box size={20} className="text-orange-600" /> },
                      categories: { title: 'Product Categories', icon: <Layers size={20} className="text-teal-600" /> },
                      catalogs: { title: 'Catalog Content', icon: <Folder size={20} className="text-red-600" /> }
                    };
                    const { title: modelTitle, icon: modelIcon } = modelTitleMap[modelType];

                    return (
                      <Col xs={24} sm={12} lg={8} key={modelType}>
                        <Card
                          className={`rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${isTrained ? 'border-l-4 border-solid border-green-500 bg-white' : 'border-l-4 border-solid border-gray-300 bg-gray-50'}`}
                          title={<Space>{modelIcon} <Text strong className="text-base">{modelTitle}</Text></Space>}
                          extra={isTrained ? <Tag color="success">Active</Tag> : <Tag color="default">Untrained</Tag>}
                        >
                          {isTrained ? (
                            <div className="space-y-3">
                              <Statistic title="Trained Samples" value={result.trainedSamples?.toLocaleString()} />
                              <Statistic title="Model Loss" value={result.finalLoss?.toFixed(4) || 'N/A'} precision={4} />
                              <Statistic title="Prediction Confidence" value={(result.examplePrediction * 100).toFixed(1)} suffix="%" />
                              <Button
                                type="link"
                                size="small"
                                onClick={() => setActiveTab(modelType)}
                                className="!px-0 mt-2 text-indigo-600 hover:text-indigo-800"
                              >
                                View Detailed Report <span aria-hidden="true">&rarr;</span>
                              </Button>
                            </div>
                          ) : (
                            <Result
                              status="info"
                              title="Model Not Trained"
                              subTitle="This model has not yet been trained. Please navigate to its tab to start."
                              extra={
                                <Button type="primary" size="small" onClick={() => setActiveTab(modelType)} className="rounded-lg">
                                  Train Now
                                </Button>
                              }
                              className="!p-0 !pb-4"
                            />
                          )}
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </TabPane>

            {/* System Status Tab */}
            <TabPane
              key="system-status"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Cloud size={20} className="mr-3 text-green-600" />
                  <span className="font-medium">System Status</span>
                </span>
              }
            >
              <div className="py-6 space-y-8">
                <Title level={3} className="text-gray-800 font-bold leading-tight">
                  Real-time AI System Health Overview
                </Title>
                <Paragraph className="text-lg leading-relaxed text-gray-700 mb-8 max-w-3xl">
                  Monitor the operational status of your AI training infrastructure and related services. Stay informed about system uptime, resource utilization, and potential issues.
                </Paragraph>

                <Row gutter={[32, 32]}>
                  <Col xs={24} md={12} lg={8}>
                    <Card className="rounded-2xl shadow-xl border border-green-100 bg-green-50" hoverable>
                      <Statistic
                        title={<Text strong className="text-green-700 text-lg">Core Services</Text>}
                        value="Operational"
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<CheckCircle size={24} className="text-green-500" />}
                      />
                      <Paragraph type="secondary" className="mt-3 text-base">All essential AI training services are running smoothly.</Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Card className="rounded-2xl shadow-xl border border-blue-100 bg-blue-50" hoverable>
                      <Statistic
                        title={<Text strong className="text-blue-700 text-lg">Data Connectors</Text>}
                        value="Active (6/7)"
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<Database size={24} className="text-blue-500" />}
                      />
                      <Paragraph type="secondary" className="mt-3 text-base">Monitoring data source connections for anomalies.</Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Card className="rounded-2xl shadow-xl border border-orange-100 bg-orange-50" hoverable>
                      <Statistic
                        title={<Text strong className="text-orange-700 text-lg">Resource Utilization</Text>}
                        value="85%"
                        valueStyle={{ color: '#faad14' }}
                        prefix={<Cpu size={24} className="text-orange-500" />}
                      />
                      <Paragraph type="secondary" className="mt-3 text-base">Current CPU and GPU load across training clusters.</Paragraph>
                    </Card>
                  </Col>
                </Row>

                <Divider className="!my-12 border-t-2 border-indigo-100" />

                <Title level={4} className="text-gray-800 font-bold">Recent System Events</Title>
                <Timeline className="pt-4">
                  <Timeline.Item color="green">
                    <Text strong>June 25, 2025 - 10:30 AM:</Text> Product Model Training completed successfully.
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <Text strong>June 25, 2025 - 08:15 AM:</Text> Scheduled database backup initiated.
                  </Timeline.Item>
                  <Timeline.Item color="red">
                    <Text strong>June 24, 2025 - 04:00 PM:</Text> Opportunity Model Training failed due to API timeout.
                  </Timeline.Item>
                  <Timeline.Item color="gray">
                    <Text strong>June 24, 2025 - 09:00 AM:</Text> System health check completed with no issues.
                  </Timeline.Item>
                </Timeline>
              </div>
            </TabPane>

            {/* Training History Tab */}
            <TabPane
              key="training-history"
              tab={
                <span className="flex items-center text-lg px-2 py-1">
                  <Clock size={20} className="mr-3 text-yellow-600" />
                  <span className="font-medium">Training History</span>
                </span>
              }
            >
              <div className="py-6 space-y-8">
                <Title level={3} className="text-gray-800 font-bold leading-tight">
                  Detailed Log of All Training Runs
                </Title>
                <Paragraph className="text-lg leading-relaxed text-gray-700 mb-8 max-w-3xl">
                  Review past training sessions for each model, including their status, performance metrics, and any associated errors. This helps in tracking progress and debugging.
                </Paragraph>

                <List
                  itemLayout="horizontal"
                  dataSource={trainingHistory}
                  renderItem={item => (
                    <List.Item
                      className={`rounded-lg p-4 mb-4 shadow-sm transition-all duration-300 ${
                        item.status === 'success' ? 'bg-green-50 border-l-4 border-green-400' :
                        item.status === 'failed' ? 'bg-red-50 border-l-4 border-red-400' :
                        'bg-gray-50 border-l-4 border-gray-300'
                      }`}
                    >
                      <List.Item.Meta
                        avatar={
                          item.status === 'success' ? <CheckCircle className="text-green-500" size={24} /> :
                          item.status === 'failed' ? <XCircle className="text-red-500" size={24} /> :
                          <Info className="text-gray-500" size={24} />
                        }
                        title={
                          <Text strong className="text-lg text-gray-800">
                            {titleCase(item.modelType)} Model Training
                            <Tag color={item.status === 'success' ? 'green' : 'red'} className="ml-3 rounded-full text-sm">
                              {item.status === 'success' ? 'Success' : 'Failed'}
                            </Tag>
                          </Text>
                        }
                        description={
                          <div className="text-gray-600 text-sm space-y-1">
                            <Paragraph className="mb-0">
                              <Text strong>Timestamp:</Text> {item.timestamp}
                            </Paragraph>
                            <Paragraph className="mb-0">
                              <Text strong>Trained Samples:</Text> {item.trainedSamples?.toLocaleString() || 'N/A'}
                            </Paragraph>
                            <Paragraph className="mb-0">
                              <Text strong>Final Loss:</Text> {typeof item.finalLoss === 'number' ? item.finalLoss.toFixed(4) : item.finalLoss || 'N/A'}
                            </Paragraph>
                            <Paragraph className="mb-0">
                              <Text strong>Duration:</Text> {item.duration}
                            </Paragraph>
                            {item.errorMessage && (
                              <Paragraph type="danger" className="mb-0">
                                <Text strong>Error:</Text> {item.errorMessage}
                              </Paragraph>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </TabPane>
          </Tabs>
        )}

        {error && (
          <Alert
            message="Global System Alert"
            description={
              <Paragraph className="text-base">
                An unexpected system-wide error occurred:
                <Text code className="block mt-2 bg-gray-100 p-2 rounded-md whitespace-pre-wrap">
                  {error}
                </Text>
                <Button type="link" onClick={() => setError(null)} className="mt-3 !px-0">
                  Dismiss Alert
                </Button>
              </Paragraph>
            }
            type="error"
            showIcon
            className="mt-8 rounded-lg shadow-xl border-red-300"
            closable
            onClose={() => setError(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AIModelTraining;