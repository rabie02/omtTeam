import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SearchOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';

const ProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('http://localhost:3000/api/products', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAllProducts(response.data.data);
        const savedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        setSearchHistory(savedHistory);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/login');
        } else {
          setError(`Failed to load products: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [navigate]);

  const addToHistory = (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    const updatedHistory = [
      searchTerm,
      ...searchHistory.filter(item => item.toLowerCase() !== searchTerm.toLowerCase())
    ].slice(0, 5);
    
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const preprocessText = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase().trim();
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      try {
        const searchTerm = preprocessText(query);
        const filtered = allProducts.filter(product => {
          const nameFields = [product.name, product.display_name];
          const codeField = product.code;
          
          return (
            nameFields.some(field => 
              field && preprocessText(field).includes(searchTerm)
            ) || 
            (codeField && preprocessText(codeField).includes(searchTerm)
          ));
        });

        const sortedResults = filtered.sort((a, b) => {
          const aName = preprocessText(a.display_name || a.name);
          const bName = preprocessText(b.display_name || b.name);
          const aCode = preprocessText(a.code || '');
          const bCode = preprocessText(b.code || '');
          
          if (aName === searchTerm) return -1;
          if (bName === searchTerm) return 1;
          if (aCode === searchTerm) return -1;
          if (bCode === searchTerm) return 1;
          if (aName.startsWith(searchTerm)) return -1;
          if (bName.startsWith(searchTerm)) return 1;
          if (aCode.startsWith(searchTerm)) return -1;
          if (bCode.startsWith(searchTerm)) return 1;
          return aName.localeCompare(bName);
        });

        setResults(sortedResults.slice(0, 5));
        setError(null);
      } catch (err) {
        setError(`Search error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, allProducts]);

const handleSelectProduct = (product) => {
  addToHistory(product.display_name || product.name);
  setQuery('');
  setResults([]);
  setShowDropdown(false);
  
  // Use absolute path to ensure correct navigation
  navigate(`/dashboard/products/${product.sys_id}`, { replace: false });

  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-80" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search products by name or code..."
          className="w-full pl-10 pr-8 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white text-gray-800 shadow-sm transition-all duration-200"
        />
        <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <CloseOutlined />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {showDropdown && (
        <div className="absolute z-20 mt-2 w-full bg-white shadow-xl rounded-xl border border-gray-200 max-h-96 overflow-auto">
          {!query && searchHistory.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 px-3 py-1">RECENT SEARCHES</div>
              {searchHistory.map((term, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    setQuery(term);
                    setShowDropdown(true);
                  }}
                  className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer"
                >
                  <ClockCircleOutlined className="text-gray-400 mr-2" />
                  <span className="text-gray-700">{term}</span>
                </div>
              ))}
            </div>
          )}

          {query && (
            <>
              {results.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-gray-500 px-3 py-2">PRODUCTS</div>
                  {results.map((product) => (
                    <div 
                      key={product.sys_id} 
                      onClick={() => handleSelectProduct(product)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="truncate">
                          <h3 className="text-sm font-medium text-gray-800">
                            <Highlighter
                              highlightClassName="bg-yellow-200"
                              searchWords={[query]}
                              autoEscape={true}
                              textToHighlight={product.display_name || product.name}
                            />
                          </h3>
                          {product.code && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              <Highlighter
                                highlightClassName="bg-yellow-200"
                                searchWords={[query]}
                                autoEscape={true}
                                textToHighlight={`SKU: ${product.code}`}
                              />
                            </div>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          product.status === 'Published' 
                            ? 'bg-green-100 text-green-800' 
                            : product.status === 'In Draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status || 'Unknown'}
                        </span>
                      </div>
                      {product.short_description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {product.short_description}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              ) : !isLoading ? (
                <div className="p-4 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No products found for <span className="font-medium">"{query}"</span></p>
                  <p className="text-xs text-gray-400 mt-1">Try different product names or codes</p>
                </div>
              ) : null}
            </>
          )}

          <div className="p-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <span className="font-medium">Tip:</span> Try searching by product name or SKU code
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-1 text-xs text-red-600 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;