import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  DeploymentUnitOutlined
} from '@ant-design/icons';

import axios from 'axios';
import { 
  Spin, Alert, Card, Tag, Row, Col, 
  Divider, Typography, Collapse, Descriptions, 
  Button, Space, Image, List, Table, Badge 
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [specDetails, setSpecDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const productRes = await axios.get(`http://localhost:3000/api/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProduct(productRes.data.data);

        if (productRes.data.data.product_specification) {
          const specId = productRes.data.data.product_specification.link.split('/').pop();
          const specRes = await axios.get(`http://localhost:3000/api/product-specs/${specId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSpecDetails(specRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Spin size="large" tip="Loading product details..." />
    </div>
  );

  if (!product) return (
    <div style={{ padding: '24px' }}>
      <Alert 
        message="Product Not Found" 
        description="The requested product could not be loaded. Please check the product ID and try again."
        type="error" 
        showIcon
        style={{ maxWidth: '800px', margin: '0 auto' }}
      />
      <Button 
        type="primary" 
        onClick={() => navigate(-1)}
        style={{ marginTop: '24px' }}
      >
        Back to Products
      </Button>
    </div>
  );

  const configJson = product.configuration_json ? JSON.parse(product.configuration_json) : null;

  // Feature tags for quick scanning
  const featureTags = [
    { label: `$${product.mrc} MRC`, icon: <DollarOutlined />, color: 'green' },
    { label: `$${product.nrc} NRC`, icon: <DollarOutlined />, color: 'blue' },
    { label: product.contract_term, icon: <CalendarOutlined />, color: 'purple' },
    { label: product.offering_type, icon: <ClusterOutlined />, color: 'orange' },
    { label: product.status, icon: <CheckCircleOutlined />, color: product.status === 'Published' ? 'green' : 'orange' }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: '24px', paddingLeft: 0 }}
      >
        Back to Products
      </Button>

      <Card 
        bordered={false} 
        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
        bodyStyle={{ padding: '24px' }}
      >
        {/* Header Section */}
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <div style={{ 
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)', 
              padding: '32px 24px', 
              borderRadius: '12px', 
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#1890ff',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 4px 8px rgba(24, 144, 255, 0.2)'
              }}>
                <DatabaseOutlined style={{ fontSize: '36px', color: 'white' }} />
              </div>
              <Title level={3} style={{ marginBottom: '8px' }}>{product.display_name || product.name}</Title>
              <Text type="secondary" style={{ marginBottom: '16px' }}>{product.code}</Text>
              
              <Space size={[8, 8]} wrap style={{ justifyContent: 'center', marginTop: '16px' }}>
                {featureTags.map((tag, index) => (
                  <Tag icon={tag.icon} color={tag.color} key={index} style={{ margin: 0 }}>
                    {tag.label}
                  </Tag>
                ))}
              </Space>
            </div>
          </Col>
          
          <Col xs={24} md={16}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={2} style={{ marginBottom: '8px' }}>
                {product.display_name || product.name}
                {product.status === 'Published' && (
                  <Badge 
                    status="success" 
                    text="Published" 
                    style={{ 
                      marginLeft: '16px',
                      fontSize: '14px',
                      fontWeight: 'normal',
                      color: '#52c41a'
                    }} 
                  />
                )}
              </Title>
              
              <Paragraph style={{ 
                fontSize: '16px', 
                lineHeight: '1.6',
                color: '#595959'
              }}>
                {product.short_description}
              </Paragraph>
            </div>
            
            <Divider style={{ margin: '24px 0' }} />
            
            <Descriptions 
              bordered 
              column={{ xs: 1, sm: 2 }} 
              size="middle"
              labelStyle={{ fontWeight: '500' }}
              contentStyle={{ fontWeight: '400' }}
            >
              <Descriptions.Item 
                label={
                  <Space>
                    <DollarOutlined style={{ color: '#1890ff' }} />
                    <span>Monthly Cost</span>
                  </Space>
                }
              >
                <Text strong style={{ fontSize: '16px' }}>${product.mrc}</Text>
              </Descriptions.Item>

              <Descriptions.Item 
                label={
                  <Space>
                    <ThunderboltOutlined style={{ color: '#1890ff' }} />
                    <span>One-Time Cost</span>
                  </Space>
                }
              >
                <Text strong style={{ fontSize: '16px' }}>${product.nrc}</Text>
              </Descriptions.Item>

              <Descriptions.Item 
                label={
                  <Space>
                    <CalendarOutlined style={{ color: '#1890ff' }} />
                    <span>Contract Term</span>
                  </Space>
                }
              >
                <Text strong>{product.contract_term}</Text>
              </Descriptions.Item>

              <Descriptions.Item 
                label={
                  <Space>
                    <DeploymentUnitOutlined style={{ color: '#1890ff' }} />
                    <span>Offering Type</span>
                  </Space>
                }
              >
                <Text strong>{product.offering_type}</Text>
              </Descriptions.Item>

              <Descriptions.Item 
                label={
                  <Space>
                    <SafetyOutlined style={{ color: '#1890ff' }} />
                    <span>Sub-Type</span>
                  </Space>
                }
              >
                <Text strong>{product.offering_sub_type}</Text>
              </Descriptions.Item>

              <Descriptions.Item 
                label={
                  <Space>
                    <TeamOutlined style={{ color: '#1890ff' }} />
                    <span>Product Owner</span>
                  </Space>
                }
              >
                <Text strong>{product.owner?.display_value}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>

        {/* Detailed Information */}
        <Divider orientation="left" style={{ 
          fontSize: '18px',
          fontWeight: '500',
          margin: '40px 0 24px'
        }}>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          Product Details
        </Divider>
        
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Collapse 
              bordered={false}
              defaultActiveKey={['description']}
              expandIconPosition="right"
              style={{ background: 'transparent' }}
            >
              <Panel 
                header={
                  <span style={{ fontWeight: '500' }}>
                    <InfoCircleOutlined style={{ marginRight: '8px' }} />
                    Product Description
                  </span>
                } 
                key="description"
                style={{ 
                  background: '#fff',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #f0f0f0'
                }}
              >
                <Paragraph style={{ 
                  whiteSpace: 'pre-line',
                  fontSize: '15px',
                  lineHeight: '1.7'
                }}>
                  {product.description || 'No description available.'}
                </Paragraph>
              </Panel>
              
              {specDetails && (
                <Panel 
                  header={
                    <span style={{ fontWeight: '500' }}>
                      <DatabaseOutlined style={{ marginRight: '8px' }} />
                      Technical Specifications
                    </span>
                  } 
                  key="specs"
                  style={{ 
                    background: '#fff',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                    <Descriptions.Item label="Specification Name" span={2}>
                      <Text strong>{specDetails.name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                      {specDetails.description || 'No description available.'}
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>
              )}

              {configJson && (
                <Panel 
                  header={
                    <span style={{ fontWeight: '500' }}>
                      <ClusterOutlined style={{ marginRight: '8px' }} />
                      Configuration Details
                    </span>
                  } 
                  key="config"
                  style={{ 
                    background: '#fff',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #f0f0f0'
                  }}
                >
                  <Table
                    columns={[
                      { 
                        title: 'Attribute', 
                        dataIndex: 'key', 
                        width: 200,
                        render: (text) => <Text strong>{text}</Text>
                      },
                      { 
                        title: 'Value', 
                        dataIndex: 'value',
                        render: (text) => <Text>{text}</Text>
                      }
                    ]}
                    dataSource={Object.entries(configJson.product?.attributes || {}).map(([key, val]) => ({
                      key,
                      value: typeof val === 'object' ? JSON.stringify(val) : val
                    }))}
                    size="middle"
                    pagination={false}
                    bordered
                    style={{ marginTop: '16px' }}
                  />
                </Panel>
              )}

              <Panel 
                header={
                  <span style={{ fontWeight: '500' }}>
                    <SafetyOutlined style={{ marginRight: '8px' }} />
                    Additional Information
                  </span>
                } 
                key="tech"
                style={{ 
                  background: '#fff',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #f0f0f0'
                }}
              >
                <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                  <Descriptions.Item label="Start Date">
                    <Text strong>{product.start_date || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="End Date">
                    <Text strong>{product.end_date || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="External Version">
                    <Text strong>{product.external_version || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Distribution Channel">
                    <Text strong>{product.distribution_channel || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Periodicity">
                    <Text strong>{product.periodicity || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Pricing Method">
                    <Text strong>{product.pricing_method || 'N/A'}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Panel>
            </Collapse>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ProductDetails;