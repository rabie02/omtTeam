import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Pagination, Spin, Empty, message } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { getallPublished } from '../../../features/servicenow/product-specification/productSpecificationSlice';
import { searchAI, setSearchTerm as setAiSearchTerm, clearResults } from '../../../features/servicenow/ai-search/aiSearchSlice';
import defaultProductImage from '@assets/default-product.png';
import Chatbot from './Chatbot';

const { Search } = Input;
const { Meta } = Card;


const ProductSpecifications = () => {
  const dispatch = useDispatch();
  
  // Product specs from Redux
  const {
    data: specs,
    loading: specsLoading,
    error: specsError
  } = useSelector((state) => state.productSpecification);
  
  // AI Search from Redux
  const {
    results: aiResults,
    loading: isAiSearching,
    error: aiSearchError,
    searchTerm: aiSearchTerm
  } = useSelector((state) => state.aiSearch);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  useEffect(() => {
    dispatch(getallPublished());
    
    const interval = setInterval(() => {
      dispatch(getallPublished());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (aiSearchError) {
      message.error(aiSearchError);
    }
  }, [aiSearchError]);

  const filteredSpecs = specs?.filter(spec =>
    spec?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    spec?.display_name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  ) || [];


  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredSpecs.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredSpecs.length / productsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleAiSearch = () => {
    if (!aiSearchTerm.trim()) {
      message.warning('Please enter a search term');
      return;
    }
    dispatch(searchAI(aiSearchTerm));
  };

  const handleAiSearchTermChange = (e) => {
    dispatch(setAiSearchTerm(e.target.value));
  };

  const handleClearAiResults = () => {
    dispatch(clearResults());
  };

  if (specsLoading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Spin size="large" />
      <p className="mt-4 text-gray-600">Loading specifications...</p>
    </div>
  );

  if (specsError) return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-red-500 font-medium">Error: {specsError}</p>
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
              setCurrentPage(1);
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
          {currentProducts.length === 0 ? (
            <Empty
              description="No specifications found"
              className="flex flex-col items-center justify-center py-10"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((spec) => (
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
                      title={<div className="truncate">{spec.displayName}</div>}
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
                    current={currentPage}
                    total={filteredSpecs.length}
                    pageSize={productsPerPage}
                    onChange={paginate}
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
            onChange={handleAiSearchTermChange}
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

        {/* AI Results - remains the same but now using Redux-managed state */}
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