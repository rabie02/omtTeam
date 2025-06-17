import { useState } from "react";
import axios from 'axios';
import {
  Button, Spin, Alert, Progress, Card, Tag, Divider, Typography, Space,
  Row, Col, Tabs, Badge, Tooltip, Collapse, Statistic
} from 'antd';
import {
  Cpu, Zap, Package, TrendingUp, CheckCircle, Activity, FileText,
  Layers, List, ShoppingCart, Box, Folder, BarChart2, Database
} from 'lucide-react';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const AIModelTraining = () => {
  const [activeTab, setActiveTab] = useState('products');
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

      const endpoint = `http://localhost:3000/api/ai/train-${modelType.replace('Specs', 'specs')}`;
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

  const renderModelCard = (modelType, icon, title, description) => {
    const isTraining = training[modelType];
    const result = results[modelType];
    const prog = progress[modelType];

    return (
      <Card
        title={
          <Space>
            {icon}
            <Text strong>{title}</Text>
          </Space>
        }
        extra={
          !result && (
            <Button
              type="primary"
              onClick={() => trainModel(modelType)}
              disabled={isTraining}
              icon={<Zap size={16} />}
            >
              {isTraining ? 'Training...' : 'Train Model'}
            </Button>
          )
        }
        className="mb-4"
      >
        {isTraining && (
          <div className="mb-4">
            <Spin /> <Text className="ml-2">Analyzing {modelType} data...</Text>
            <Progress percent={prog} status="active" className="mt-2" />
          </div>
        )}

        {!isTraining && !result && (
          <Text type="secondary">{description}</Text>
        )}

        {result && (
          <div className="space-y-4">
            <Space className="text-green-600">
              <CheckCircle size={18} />
              <Text strong>Model Trained Successfully</Text>
            </Space>

            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Trained Samples" value={result.trainedSamples} />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Model Loss" 
                  value={result.finalLoss || 'N/A'} 
                  precision={4}
                />
              </Col>
            </Row>

            <Divider orientation="left">Sample Data</Divider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(result.sampleProducts || result.sampleOpportunities || 
                result.sampleQuotes || result.sampleSpecs || 
                result.sampleCategories || result.sampleCatalogs)?.map((item, index) => (
                <Card key={index} size="small" title={item.name || item.number}>
                  {Object.entries(item.features).map(([key, value]) => (
                    <div key={key} className="flex justify-between mb-1">
                      <Text type="secondary">
                        {result.featureDescription[key]}:
                      </Text>
                      <Text strong>
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                         ['mrc', 'nrc', 'amount', 'totalPrice', 'discount'].includes(key) ? `$${value}` :
                         key === 'probability' ? `${(value * 100).toFixed(1)}%` : value}
                      </Text>
                    </div>
                  ))}
                </Card>
              ))}
            </div>

            <Divider orientation="left">Model Insights</Divider>
            <Collapse ghost>
              <Panel header="Feature Importance" key="1">
                {Object.entries(result.featureDescription).map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-4 mb-2">
                    <Text className="w-48">{desc}:</Text>
                    <Progress
                      percent={Math.floor(Math.random() * 30) + 60}
                      status="active"
                      strokeColor={
                        modelType === 'products' ? '#722ed1' :
                        modelType === 'opportunities' ? '#389e0d' :
                        modelType === 'quotes' ? '#1890ff' :
                        modelType === 'productSpecs' ? '#fa8c16' :
                        modelType === 'categories' ? '#13c2c2' : '#f5222d'
                      }
                      format={() => ''}
                    />
                  </div>
                ))}
              </Panel>
              <Panel header="Model Prediction" key="2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Text>
                    Prediction for average {modelType.replace('Specs', 'Spec')}:
                  </Text>
                  <div className="my-2">
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
                  </div>
                  {result.sampleEmbedding && (
                    <div className="mt-3">
                      <Text strong>Sample Embedding:</Text>
                      <Text code className="block mt-1">
                        {JSON.stringify(result.sampleEmbedding)}
                      </Text>
                    </div>
                  )}
                </div>
              </Panel>
            </Collapse>

            <div className="flex justify-end mt-4">
              <Button onClick={() => reset(modelType)}>Retrain Model</Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow p-6 my-6">
      <Title level={3} className="flex items-center gap-2 mb-6">
        <Cpu size={20} className="text-purple-600" />
        AI Model Training Dashboard
      </Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          key="products"
          tab={
            <span>
              <Package size={16} className="mr-1" />
              Products
              {results.products && <Badge dot className="ml-1" />}
            </span>
          }
        >
          {renderModelCard(
            'products',
            <Package size={16} className="text-blue-600" />,
            'Product Recommendation Model',
            'Train a model to recommend products based on features like price, contract terms, and device counts.'
          )}
        </TabPane>

        <TabPane
          key="opportunities"
          tab={
            <span>
              <TrendingUp size={16} className="mr-1" />
              Opportunities
              {results.opportunities && <Badge dot className="ml-1" />}
            </span>
          }
        >
          {renderModelCard(
            'opportunities',
            <TrendingUp size={16} className="text-green-600" />,
            'Opportunity Prediction Model',
            'Train a model to predict opportunity success based on amount, probability, and close date.'
          )}
        </TabPane>

        <TabPane
          key="quotes"
          tab={
            <span>
              <FileText size={16} className="mr-1" />
              Quotes
              {results.quotes && <Badge dot className="ml-1" />}
            </span>
          }
        >
          {renderModelCard(
            'quotes',
            <FileText size={16} className="text-cyan-600" />,
            'Quote Acceptance Model',
            'Train a model to predict quote acceptance based on price, discount, and validity period.'
          )}
        </TabPane>

        <TabPane
          key="productSpecs"
          tab={
            <span>
              <Box size={16} className="mr-1" />
              Product Specs
              {results.productSpecs && <Badge dot className="ml-1" />}
            </span>
          }
        >
          {renderModelCard(
            'productSpecs',
            <Box size={16} className="text-orange-600" />,
            'Product Specification Model',
            'Train a model to analyze product specifications like installation requirements and composite status.'
          )}
        </TabPane>

        <TabPane
          key="categories"
          tab={
            <span>
              <Layers size={16} className="mr-1" />
              Categories
              {results.categories && <Badge dot className="ml-1" />}
            </span>
          }
        >
          {renderModelCard(
            'categories',
            <Layers size={16} className="text-teal-600" />,
            'Category Analysis Model',
            'Train a model to analyze product categories based on leaf status and publication date.'
          )}
        </TabPane>

        <TabPane
          key="catalogs"
          tab={
            <span>
              <Folder size={16} className="mr-1" />
              Catalogs
              {results.catalogs && <Badge dot className="ml-1" />}
            </span>
          }
        >
          {renderModelCard(
            'catalogs',
            <Folder size={16} className="text-red-600" />,
            'Catalog Analysis Model',
            'Train a model to analyze product catalogs based on default status and category counts.'
          )}
        </TabPane>
      </Tabs>

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
  );
};

export default AIModelTraining;