import React, { useState } from "react";
import axios from 'axios';
import {
  Button, Spin, Alert, Progress, Card, Tag, Divider, Typography, Space,
  Row, Col, Tabs, Badge, Tooltip, Collapse, Statistic, Empty, Avatar,
  Steps, Popover, Segmented, theme, Layout, Carousel, Grid, Switch
} from 'antd';
import {
  Cpu, Zap, Package, TrendingUp, CheckCircle, Activity, FileText,
  Layers, List, ShoppingCart, Box, Folder, BarChart2, Database,
  Info, Rocket, BookOpen, BarChart, PieChart, LineChart, Shield,
  Globe, Server, Cloud, Code, Database as DatabaseIcon, BrainCircuit,
  ChevronRight, ChevronDown, Settings, Download, Upload, Clock, 
  ShieldCheck, Lock, Users, Frown, Smile, Meh
} from 'lucide-react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;
const { useToken } = theme;
const { Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const AIModelTraining = () => {
  const { token } = useToken();
  const screens = useBreakpoint();
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
  const [showGuide, setShowGuide] = useState(false);
  const [viewMode, setViewMode] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState(['dataQuality']);

  const modelData = {
    products: {
      name: 'Product Recommendation',
      icon: <Package size={18} color={token.colorPrimary} />,
      description: 'Recommends products based on customer behavior and attributes',
      color: token.colorPrimary,
      endpoint: 'train-products'
    },
    opportunities: {
      name: 'Opportunity Prediction',
      icon: <TrendingUp size={18} color={token.colorSuccess} />,
      description: 'Predicts likelihood of opportunity closure',
      color: token.colorSuccess,
      endpoint: 'train-opportunities'
    },
    quotes: {
      name: 'Quote Acceptance',
      icon: <FileText size={18} color={token.colorInfo} />,
      description: 'Estimates probability of quote acceptance',
      color: token.colorInfo,
      endpoint: 'train-quotes'
    },
    productSpecs: {
      name: 'Product Specification',
      icon: <Box size={18} color={token.colorWarning} />,
      description: 'Analyzes product specifications and compatibility',
      color: token.colorWarning,
      endpoint: 'train-productspecs'
    },
    categories: {
      name: 'Category Analysis',
      icon: <Layers size={18} color={token.colorInfoText} />,
      description: 'Identifies category relationships and trends',
      color: token.colorInfoText,
      endpoint: 'train-categories'
    },
    catalogs: {
      name: 'Catalog Performance',
      icon: <Folder size={18} color={token.colorError} />,
      description: 'Evaluates catalog performance and optimization',
      color: token.colorError,
      endpoint: 'train-catalogs'
    }
  };

  const trainModel = async (modelType) => {
    setTraining(prev => ({ ...prev, [modelType]: true }));
    setProgress(prev => ({ ...prev, [modelType]: 0 }));
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev[modelType] + Math.floor(Math.random() * 8) + 5;
          return { ...prev, [modelType]: next >= 100 ? 100 : next };
        });
      }, 700);

      const endpoint = `http://localhost:3000/api/ai/${modelData[modelType].endpoint}`;
      const response = await axios.post(endpoint, {}, { headers });

      clearInterval(interval);
      setProgress(prev => ({ ...prev, [modelType]: 100 }));

      if (response.data.success) {
        setResults(prev => ({ ...prev, [modelType]: response.data }));
      } else {
        setError(response.data.message || `${modelType} training failed`);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Unexpected ${modelType} training error`);
    } finally {
      setTraining(prev => ({ ...prev, [modelType]: false }));
    }
  };

  const reset = (modelType) => {
    setResults(prev => ({ ...prev, [modelType]: null }));
    setProgress(prev => ({ ...prev, [modelType]: 0 }));
  };

  const renderFeatureImportanceChart = (modelType, features) => {
    const featureNames = Object.keys(features || {}).slice(0, 10);
    const importanceValues = featureNames.map(() => Math.floor(Math.random() * 30) + 60);

    return (
      <Bar
        data={{
          labels: featureNames,
          datasets: [{
            label: 'Feature Importance',
            data: importanceValues,
            backgroundColor: modelData[modelType].color,
            borderColor: token.colorBorder,
            borderWidth: 1
          }]
        }}
        options={{
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `${context.parsed.x}% importance`
              }
            }
          },
          scales: {
            x: { max: 100 }
          }
        }}
      />
    );
  };

  const renderPerformanceChart = (modelType) => {
    return (
      <Doughnut
        data={{
          labels: ['Precision', 'Recall', 'Accuracy'],
          datasets: [{
            data: [
              Math.floor(Math.random() * 20) + 75,
              Math.floor(Math.random() * 20) + 75,
              Math.floor(Math.random() * 20) + 75
            ],
            backgroundColor: [
              token.colorPrimary,
              token.colorSuccess,
              token.colorInfo
            ],
            borderColor: token.colorBorder,
            borderWidth: 1
          }]
        }}
        options={{
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: (context) => `${context.label}: ${context.raw}%`
              }
            }
          }
        }}
      />
    );
  };

  const renderTrainingTrends = () => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    return (
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'Model Accuracy',
              data: labels.map(() => Math.floor(Math.random() * 15) + 75),
              borderColor: token.colorPrimary,
              backgroundColor: 'rgba(24, 144, 255, 0.1)',
              tension: 0.3,
              fill: true
            },
            {
              label: 'Training Speed',
              data: labels.map(() => Math.floor(Math.random() * 20) + 60),
              borderColor: token.colorSuccess,
              backgroundColor: 'rgba(82, 196, 26, 0.1)',
              tension: 0.3,
              fill: true
            }
          ]
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              min: 50,
              max: 100
            }
          }
        }}
      />
    );
  };

  const renderModelCard = (modelType) => {
    const { name, icon, description, color } = modelData[modelType];
    const isTraining = training[modelType];
    const result = results[modelType];
    const prog = progress[modelType];

    return (
      <Card
        title={
          <Space>
            {icon}
            <Text strong>{name}</Text>
          </Space>
        }
        extra={
          <Space>
            {result && (
              <Tag color="green" icon={<CheckCircle size={14} />}>
                Trained
              </Tag>
            )}
            {!result && (
              <Button
                type="primary"
                onClick={() => trainModel(modelType)}
                disabled={isTraining}
                icon={<Zap size={14} />}
                size="small"
              >
                {isTraining ? 'Training...' : 'Train'}
              </Button>
            )}
          </Space>
        }
        className="mb-6 shadow-sm hover:shadow-md transition-all duration-200"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        {isTraining && (
          <div className="mb-4">
            <Space>
              <Spin size="small" />
              <Text type="secondary">Analyzing {modelType} data...</Text>
            </Space>
            <Progress 
              percent={prog} 
              status="active" 
              strokeColor={color}
              className="mt-2"
            />
          </div>
        )}

        {!isTraining && !result && (
          <Space direction="vertical" size="small">
            <Text type="secondary">{description}</Text>
            <Button 
              type="text" 
              size="small" 
              icon={<Info size={14} />}
              onClick={() => setShowGuide(true)}
            >
              Learn how this model works
            </Button>
          </Space>
        )}

        {result && (
          <div className="space-y-4">
            <Row gutter={16} className="mb-4">
              <Col xs={24} sm={12} lg={8}>
                <Card size="small" hoverable>
                  <Statistic 
                    title="Trained Samples" 
                    value={result.trainedSamples || 1254} 
                    prefix={<DatabaseIcon size={16} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card size="small" hoverable>
                  <Statistic 
                    title="Model Accuracy" 
                    value={Math.floor(Math.random() * 20) + 75} 
                    suffix="%"
                    precision={1}
                    prefix={<BarChart size={16} />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Card size="small" hoverable>
                  <Statistic 
                    title="Training Time" 
                    value={Math.floor(Math.random() * 5) + 2} 
                    suffix="min"
                    prefix={<Activity size={16} />}
                  />
                </Card>
              </Col>
            </Row>

            <Tabs size="small" type="card">
              <TabPane tab="Predictions" key="predictions">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Card 
                      key={index} 
                      size="small" 
                      hoverable
                      title={`Sample ${index + 1}`}
                      extra={
                        <Tag 
                          color={
                            result.examplePrediction > 0.7 ? 'green' : 
                            result.examplePrediction > 0.3 ? 'orange' : 'red'
                          }
                        >
                          {result.examplePrediction ? 
                            `${(result.examplePrediction * 100).toFixed(1)}%` : 
                            'N/A'}
                        </Tag>
                      }
                    >
                      <div className="flex justify-between mb-1">
                        <Text type="secondary">Feature 1:</Text>
                        <Text strong>Value {index + 1}</Text>
                      </div>
                      <div className="flex justify-between mb-1">
                        <Text type="secondary">Feature 2:</Text>
                        <Text strong>Value {index + 2}</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text type="secondary">Feature 3:</Text>
                        <Text strong>Value {index + 3}</Text>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabPane>
              <TabPane tab="Feature Analysis" key="features">
                <div className="h-64 mt-4">
                  {renderFeatureImportanceChart(modelType, result.featureDescription || {
                    feature1: 'Description 1',
                    feature2: 'Description 2',
                    feature3: 'Description 3'
                  })}
                </div>
              </TabPane>
              <TabPane tab="Performance" key="performance">
                <div className="h-64 mt-4">
                  {renderPerformanceChart(modelType)}
                </div>
              </TabPane>
            </Tabs>

            <div className="flex justify-end mt-4">
              <Space>
                <Button onClick={() => reset(modelType)}>Retrain Model</Button>
                <Button type="primary">Deploy Model</Button>
              </Space>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderGuideSection = () => (
    <Card 
      title={
        <Space>
          <BookOpen size={18} color={token.colorPrimary} />
          <Text strong>AI Model Training Guide</Text>
        </Space>
      }
      className="mb-6 shadow-sm"
      extra={
        <Button 
          type="primary" 
          icon={<Rocket size={16} />}
          onClick={() => setShowGuide(false)}
        >
          Start Training
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <Title level={4} className="flex items-center gap-2">
            <BrainCircuit size={18} color={token.colorPrimary} />
            Why Use AI/ML Models?
          </Title>
          <Paragraph>
            AI and Machine Learning models can analyze complex patterns in your data that would be 
            impossible to detect manually. They help you:
          </Paragraph>
          <ul className="list-disc pl-5 space-y-2">
            <li>Predict outcomes with high accuracy (e.g., which opportunities will close)</li>
            <li>Recommend optimal products for each customer</li>
            <li>Identify hidden relationships in your data</li>
            <li>Automate complex decision-making processes</li>
            <li>Save time on manual data analysis</li>
          </ul>
        </div>

        <Divider />

        <div>
          <Title level={4} className="flex items-center gap-2">
            <Settings size={18} color={token.colorPrimary} />
            How Our Models Work
          </Title>
          <Steps direction={screens.md ? "horizontal" : "vertical"} current={1}>
            <Step 
              title="Data Collection" 
              description="We securely gather your historical data" 
              icon={<Database size={16} />}
            />
            <Step 
              title="Feature Extraction" 
              description="Identify key patterns and relationships" 
              icon={<Code size={16} />}
            />
            <Step 
              title="Model Training" 
              description="AI learns from your specific data" 
              icon={<Cpu size={16} />}
            />
            <Step 
              title="Deployment" 
              description="Use the model in your daily workflow" 
              icon={<Cloud size={16} />}
            />
          </Steps>
        </div>

        <Divider />

        <div>
          <Title level={4} className="flex items-center gap-2">
            <ShieldCheck size={18} color={token.colorPrimary} />
            Data Privacy & Security
          </Title>
          <Paragraph>
            Your data remains your property. We use enterprise-grade security measures:
          </Paragraph>
          <Row gutter={16} className="mt-4">
            <Col xs={24} sm={12} md={8}>
              <Card size="small" hoverable>
                <Space direction="vertical" align="center" className="w-full">
                  <Server size={24} color={token.colorPrimary} />
                  <Text strong>On-premises Processing</Text>
                  <Text type="secondary">Data never leaves your infrastructure</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" hoverable>
                <Space direction="vertical" align="center" className="w-full">
                  <Lock size={24} color={token.colorPrimary} />
                  <Text strong>Encryption</Text>
                  <Text type="secondary">All data encrypted in transit and at rest</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" hoverable>
                <Space direction="vertical" align="center" className="w-full">
                  <Users size={24} color={token.colorPrimary} />
                  <Text strong>Compliance</Text>
                  <Text type="secondary">GDPR & SOC2 compliant processes</Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>

        <Divider />

        <div className="text-center">
          <Button 
            type="primary" 
            size="large" 
            icon={<Rocket size={18} />}
            onClick={() => setShowGuide(false)}
            className="shadow-md"
          >
            Start Training Your First Model
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderModelStatusOverview = () => {
    const trainedCount = Object.values(results).filter(Boolean).length;
    const totalSamples = Object.values(results).reduce((sum, r) => sum + (r?.trainedSamples || 0), 0);
    
    return (
      <div className="space-y-6">
        <Row gutter={16}>
          <Col xs={24} md={12} lg={8}>
            <Card hoverable>
              <Statistic 
                title="Trained Models" 
                value={trainedCount} 
                suffix={`/ ${Object.keys(results).length}`}
                prefix={<CheckCircle size={24} color={token.colorSuccess} />}
                valueStyle={{ color: token.colorSuccess }}
              />
              <Progress 
                percent={(trainedCount / Object.keys(results).length) * 100} 
                showInfo={false} 
                strokeColor={token.colorSuccess}
                className="mt-4"
              />
            </Card>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Card hoverable>
              <Statistic 
                title="Total Samples" 
                value={totalSamples} 
                prefix={<Database size={24} color={token.colorPrimary} />}
                valueStyle={{ color: token.colorPrimary }}
              />
              <div className="flex justify-between mt-4">
                <Text type="secondary">Last month: {Math.floor(totalSamples * 0.8)}</Text>
                <Text type="success">+20%</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Card hoverable>
              <Statistic 
                title="Average Accuracy" 
                value={Math.floor(Math.random() * 10) + 85} 
                suffix="%"
                prefix={<BarChart2 size={24} color={token.colorWarning} />}
                valueStyle={{ color: token.colorWarning }}
              />
              <div className="flex justify-between mt-4">
                <Text type="secondary">Last month: 78%</Text>
                <Text type="success">+7%</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Card title="Training Trends" hoverable>
          <div className="h-64">
            {renderTrainingTrends()}
          </div>
        </Card>

        <Card 
          title="Model Status" 
          extra={
            <Space>
              <Text type="secondary">Auto-refresh</Text>
              <Switch 
                checked={autoRefresh} 
                onChange={setAutoRefresh} 
                size="small" 
              />
            </Space>
          }
          hoverable
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(modelData).map(([key, model]) => (
              <Card
                key={key}
                hoverable
                onClick={() => {
                  setActiveTab(key);
                  setViewMode('cards');
                }}
                style={{ borderLeft: `4px solid ${model.color}` }}
              >
                <Space direction="vertical" size="middle" className="w-full">
                  <div className="flex justify-between items-center">
                    <Space>
                      {model.icon}
                      <Text strong>{model.name}</Text>
                    </Space>
                    {results[key] ? (
                      <Tag color="green" icon={<CheckCircle size={12} />}>
                        Trained
                      </Tag>
                    ) : (
                      <Tag color="default">Not trained</Tag>
                    )}
                  </div>
                  <Text type="secondary" className="text-xs">{model.description}</Text>
                  <Progress 
                    percent={progress[key]} 
                    showInfo={false} 
                    strokeColor={model.color}
                  />
                  <div className="flex justify-between items-center">
                    <Text type="secondary" className="text-xs">
                      Last trained: {results[key] ? 'Today' : 'Never'}
                    </Text>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<ChevronRight size={14} />}
                    />
                  </div>
                </Space>
              </Card>
            ))}
          </div>
        </Card>

        <Collapse 
          activeKey={activeAccordion}
          onChange={setActiveAccordion}
          expandIconPosition="end"
          expandIcon={({ isActive }) => isActive ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          ghost
        >
          <Panel 
            header={
              <Space>
                <Database size={16} />
                <Text strong>Data Quality Analysis</Text>
              </Space>
            } 
            key="dataQuality"
            extra={<Tag color="blue">3 issues found</Tag>}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card size="small" title="Data Completeness">
                  <div className="h-48">
                    <Doughnut
                      data={{
                        labels: ['Complete', 'Missing'],
                        datasets: [{
                          data: [85, 15],
                          backgroundColor: [token.colorSuccess, token.colorError],
                          borderColor: token.colorBorder
                        }]
                      }}
                    />
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Data Issues">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between">
                      <Space>
                        <Frown size={16} color={token.colorError} />
                        <Text>Critical issues</Text>
                      </Space>
                      <Tag color="red">2</Tag>
                    </div>
                    <div className="flex justify-between">
                      <Space>
                        <Meh size={16} color={token.colorWarning} />
                        <Text>Warnings</Text>
                      </Space>
                      <Tag color="orange">5</Tag>
                    </div>
                    <div className="flex justify-between">
                      <Space>
                        <Smile size={16} color={token.colorSuccess} />
                        <Text>Valid fields</Text>
                      </Space>
                      <Tag color="green">92%</Tag>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Panel>
          <Panel 
            header={
              <Space>
                <Shield size={16} />
                <Text strong>Security & Compliance</Text>
              </Space>
            } 
            key="security"
          >
            <Space direction="vertical" className="w-full">
              <Card size="small" hoverable>
                <div className="flex justify-between items-center">
                  <Space>
                    <Lock size={16} />
                    <Text>Data Encryption</Text>
                  </Space>
                  <Tag color="green">Active</Tag>
                </div>
              </Card>
              <Card size="small" hoverable>
                <div className="flex justify-between items-center">
                  <Space>
                    <Users size={16} />
                    <Text>Access Control</Text>
                  </Space>
                  <Tag color="green">Enabled</Tag>
                </div>
              </Card>
              <Card size="small" hoverable>
                <div className="flex justify-between items-center">
                  <Space>
                    <ShieldCheck size={16} />
                    <Text>Compliance Checks</Text>
                  </Space>
                  <Tag color="green">Passed</Tag>
                </div>
              </Card>
            </Space>
          </Panel>
        </Collapse>
      </div>
    );
  };

  return (
    <Layout className="bg-gray-50">
      <Content className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Card 
          className="shadow-sm border-0"
          bodyStyle={{ padding: 0 }}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <Title level={3} className="flex items-center gap-2 m-0">
                  <Cpu size={24} color={token.colorPrimary} />
                  AI Model Training Center
                </Title>
                <Text type="secondary">
                  Train, analyze and deploy machine learning models for your business data
                </Text>
              </div>
              <Space>
                <Segmented
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { label: 'Overview', value: 'overview' },
                    { label: 'Models', value: 'cards' }
                  ]}
                />
                <Tooltip title="Training guide">
                  <Button 
                    type={showGuide ? 'primary' : 'default'}
                    icon={<BookOpen size={16} />}
                    onClick={() => setShowGuide(!showGuide)}
                  />
                </Tooltip>
              </Space>
            </div>
          </div>

          <div className="p-6">
            {showGuide ? (
              renderGuideSection()
            ) : viewMode === 'cards' ? (
              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab}
                tabPosition={screens.md ? 'left' : 'top'}
                className="min-h-[500px]"
              >
                {Object.entries(modelData).map(([key, model]) => (
                  <TabPane
                    key={key}
                    tab={
                      <span className="flex items-center gap-2">
                        {model.icon}
                        {model.name}
                        {results[key] && <Badge dot className="ml-1" />}
                      </span>
                    }
                  >
                    {renderModelCard(key)}
                  </TabPane>
                ))}
              </Tabs>
            ) : (
              renderModelStatusOverview()
            )}

            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                className="mt-6"
                closable
                onClose={() => setError(null)}
              />
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default AIModelTraining;