import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Pagination, Spin, Empty, message } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { getPublished } from '../../../features/servicenow/product-specification/productSpecificationSlice';
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
    error: specsError,
    currentPage,
    totalItems,
    limit: apiLimit
  } = useSelector((state) => state.productSpecification);
  
  // AI Search from Redux
  const {
    results: aiResults,
    loading: isAiSearching,
    error: aiSearchError,
    searchTerm: aiSearchTerm
  } = useSelector((state) => state.aiSearch);

  const [searchTerm, setSearchTerm] = useState('');
  const [localPage, setLocalPage] = useState(1);

  // Fetch data when page changes
  useEffect(() => {
    dispatch(getPublished({ page: 1, limit: 8 }));
  }, [dispatch, localPage, apiLimit]);

  // Polling effect
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(getPublished({ page: localPage, limit: apiLimit }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dispatch, localPage, apiLimit]);

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
  
              {/* Pagination - Now using API pagination */}
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

        
      </div>
  
    </div>
  );
};

export default ProductSpecifications;