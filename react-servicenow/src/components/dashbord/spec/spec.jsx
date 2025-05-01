import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Pagination, Spin, Empty, message } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import axios from 'axios';
import defaultProductImage from '@assets/default-product.png';
import Chatbot from './Chatbot';

const { Search } = Input;
const { Meta } = Card;

const SN_CONFIG = {
  baseURL: import.meta.env.VITE_SN_URL || 'https://dev323456.service-now.com',
  auth: {
    username: import.meta.env.VITE_SN_USER || 'admin',
    password: import.meta.env.VITE_SN_PASS || 'bz!T-1ThIc1L'
  },
  endpoints: {
    searchSpecs: '/api/now/table/sn_prd_pm_product_specification'
  }
};

const ProductSpecifications = () => {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [apiLimit] = useState(8);
  
  // AI Search state
  const [aiResults, setAiResults] = useState([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchError, setAiSearchError] = useState(null);
  const [aiSearchTerm, setAiSearchTerm] = useState('');

  // Fetch data from ServiceNow
  useEffect(() => {
    const fetchSpecs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(SN_CONFIG.endpoints.searchSpecs, {
          baseURL: SN_CONFIG.baseURL,
          auth: SN_CONFIG.auth,
          params: {
            sysparm_limit: apiLimit,
            sysparm_query: 'status=published',
            sysparm_offset: (localPage - 1) * apiLimit
          }
        });
        setSpecs(response.data.result);
        setTotalItems(response.data.headers['x-total-count'] || response.data.result.length);
      } catch (err) {
        console.error('Erreur de chargement des spécifications:', err);
        setError("Impossible de charger les spécifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpecs();
    
    // Polling every 5 seconds
    const interval = setInterval(fetchSpecs, 5000);
    return () => clearInterval(interval);
  }, [localPage, apiLimit]);

  useEffect(() => {
    if (aiSearchError) {
      message.error(aiSearchError);
    }
  }, [aiSearchError]);

  // Filter specs based on search term (client-side filtering)
  const filteredSpecs = specs?.filter(spec =>
    spec?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    spec?.display_name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate total pages from API response
  const totalPages = Math.ceil(totalItems / apiLimit);

  const handlePageChange = (page) => {
    setLocalPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleAiSearch = async () => {
    if (!aiSearchTerm.trim()) {
      message.warning('Please enter a search term');
      return;
    }
    
    try {
      setIsAiSearching(true);
      setAiSearchError(null);
      // Ici vous devriez implémenter votre appel API pour la recherche AI
      // Pour l'exemple, je simule une réponse après 1 seconde
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAiResults([
        { title: 'Résultat AI 1', description: 'Description du produit trouvé par AI' },
        { title: 'Résultat AI 2', description: 'Autre produit correspondant à votre recherche' }
      ]);
    } catch (err) {
      setAiSearchError("Erreur lors de la recherche AI");
      console.error(err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleClearAiResults = () => {
    setAiResults([]);
    setAiSearchTerm('');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Spin size="large" />
      <p className="mt-4 text-gray-600">Loading specifications...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-red-500 font-medium">Error: {error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="h-36 bg-cyan-700/40 flex items-end py-3 px-5 md:px-20">
        <div className="flex w-full justify-between">
          <Search
            placeholder="Search specifications..."
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />}>Search</Button>}
            size="large"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setLocalPage(1);
            }}
            className="w-full max-w-md"
          />
        </div>
      </div>
  
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Product Specifications</h1>
  
        {/* Products Grid */}
        <div className="mb-8">
          {filteredSpecs.length === 0 ? (
            <Empty
              description="No specifications found"
              className="flex flex-col items-center justify-center py-10"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSpecs.map((spec) => (
                  <Card
                    key={spec.sys_id}
                    hoverable
                    className="h-full flex flex-col"
                    cover={
                      <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
                        <img
                          alt={spec.display_name}
                          src={spec.image_url || defaultProductImage}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => { e.target.src = defaultProductImage }}
                        />
                      </div>
                    }
                    actions={[
                      <Button type="primary" block>
                        View Details
                      </Button>
                    ]}
                  >
                    <Meta
                      title={<div className="truncate">{spec.display_name || spec.displayName}</div>}
                      description={
                        <div className="truncate text-gray-500" title={`Ref: ${spec.name}`}>
                          Ref: {spec.name}
                        </div>
                      }
                    />
                    <div className="mt-4">
                      {spec.attributes && Object.entries(spec.attributes).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-600 font-medium truncate pr-2">{key}:</span>
                          <span className="text-gray-800 font-medium text-right truncate pl-2">{value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
  
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    current={localPage}
                    total={totalItems}
                    pageSize={apiLimit}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    className="mt-4"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* AI Search Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">AI Product Search</h2>
          <p className="text-gray-600 mb-6">Describe what you're looking for and our AI will find matching products</p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Describe your ideal product..."
              size="large"
              value={aiSearchTerm}
              onChange={(e) => setAiSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button
              type="primary"
              size="large"
              loading={isAiSearching}
              onClick={handleAiSearch}
              icon={<SearchOutlined />}
              className="bg-green-500 hover:bg-green-600"
            >
              AI Search
            </Button>
            {aiResults.length > 0 && (
              <Button
                size="large"
                onClick={handleClearAiResults}
                danger
              >
                Clear
              </Button>
            )}
          </div>

          {/* AI Results */}
          {aiResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800">AI Search Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiResults.map((result, index) => (
                  <Card
                    key={index}
                    hoverable
                    className="h-full"
                  >
                    <h4 className="text-blue-500 font-medium mb-2">{result.title || 'Product'}</h4>
                    <p className="text-gray-600 mb-4 text-sm">{result.description || 'No description available'}</p>
                    <Button type="link" className="p-0">
                      Learn more <ArrowRightOutlined />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isAiSearching && (
            <div className="flex justify-center py-6">
              <Spin tip="Searching..." />
            </div>
          )}

          {!isAiSearching && aiSearchTerm && aiResults.length === 0 && (
            <Empty
              description="No AI results found"
              className="flex flex-col items-center justify-center py-6"
            />
          )}
        </div>
      </div>

      {/* Chatbot */}
      <div className="fixed bottom-8 right-8 z-50">
        <Chatbot />
      </div>
    </div>
  );
};

export default ProductSpecifications;
