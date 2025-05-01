import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Pagination, Spin, Empty, message, Modal } from 'antd';
import { SearchOutlined, ArrowRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import defaultProductImage from '@assets/default-product.png';
import Chatbot from './Chatbot';

const { Search } = Input;
const { Meta } = Card;
const { confirm } = Modal;

const SN_CONFIG = {
  baseURL: import.meta.env.VITE_SN_URL || 'https://dev323456.service-now.com',
  auth: {
    username: import.meta.env.VITE_SN_USER || 'admin',
    password: import.meta.env.VITE_SN_PASS || 'bz!T-1ThIc1L'
  },
  endpoints: {
    searchSpecs: '/api/now/table/sn_prd_pm_product_specification',
    publishSpec: '/api/now/table/sn_prd_pm_product_specification'
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
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // AI Search state
  const [aiResults, setAiResults] = useState([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchError, setAiSearchError] = useState(null);
  const [aiSearchTerm, setAiSearchTerm] = useState('');

  // Fetch data from ServiceNow
  const fetchSpecs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(SN_CONFIG.endpoints.searchSpecs, {
        baseURL: SN_CONFIG.baseURL,
        auth: SN_CONFIG.auth,
        params: {
          sysparm_limit: apiLimit,
          sysparm_query: 'status=published',
          sysparm_offset: (localPage - 1) * apiLimit,
          sysparm_display_value: true,
          sysparm_fields: 'sys_id,name,display_name,image_url,attributes,status,description'
        }
      });
      
       const countResponse = await axios.get(SN_CONFIG.endpoints.searchSpecs, {
      baseURL: SN_CONFIG.baseURL,
      auth: SN_CONFIG.auth,
      params: {
        sysparm_query: 'status=published',
        sysparm_fields: 'sys_id',
        sysparm_limit: 10000 // limite haute
      }
    });

    const publishedSpecs = response.data.result;
    setSpecs(publishedSpecs);

    setTotalItems(countResponse.data.result.length);
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError(`Erreur: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, [localPage, apiLimit]);

  useEffect(() => {
    if (aiSearchError) {
      message.error(aiSearchError);
    }
  }, [aiSearchError]);

  // Publier une spécification
  const publishSpecification = async (specId) => {
    try {
      await axios.patch(
        `${SN_CONFIG.endpoints.publishSpec}/${specId}`,
        { status: 'published' },
        {
          baseURL: SN_CONFIG.baseURL,
          auth: SN_CONFIG.auth,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      message.success('Spécification publiée avec succès');
      fetchSpecs(); // Rafraîchir la liste
    } catch (err) {
      console.error('Erreur de publication:', err);
      message.error('Échec de la publication');
    }
  };

  // Confirmation avant publication
  const showPublishConfirm = (spec) => {
    confirm({
      title: `Publier la spécification ${spec.display_name || spec.name}?`,
      icon: <ExclamationCircleOutlined />,
      content: 'Cette action rendra la spécification visible par tous les utilisateurs.',
      onOk() {
        return publishSpecification(spec.sys_id);
      },
      onCancel() {
        console.log('Annulé');
      },
    });
  };

  // Filter specs based on search term
   const filteredSpecs = specs.filter(spec =>
    spec?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    spec?.display_name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / apiLimit);

  const handlePageChange = (page) => {
    setLocalPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleAiSearch = async () => {
    if (!aiSearchTerm.trim()) {
      message.warning('Veuillez entrer un terme de recherche');
      return;
    }
    
    try {
      setIsAiSearching(true);
      setAiSearchError(null);
      
      // Simulation de recherche AI
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filtrage des résultats basé sur la recherche AI
      const aiFiltered = specs.filter(spec => 
        spec.description?.toLowerCase()?.includes(aiSearchTerm.toLowerCase())
      ).map(spec => ({
        title: spec.display_name || spec.name,
        description: spec.description || 'Pas de description disponible',
        specId: spec.sys_id
      }));
      
      setAiResults(aiFiltered.length > 0 ? aiFiltered : [
        { 
          title: 'Aucun résultat exact', 
          description: 'Essayez avec des termes différents ou consultez nos suggestions' 
        }
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

  const showSpecDetails = (spec) => {
    setSelectedSpec(spec);
    setIsModalVisible(true);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Spin size="large" />
      <p className="mt-4 text-gray-600">Chargement des spécifications...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-red-500 font-medium">Erreur: {error}</p>
      <Button 
        type="primary" 
        onClick={fetchSpecs}
        className="mt-4"
      >
        Réessayer
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="h-36 bg-cyan-700/40 flex items-end py-3 px-5 md:px-20">
        <div className="flex w-full justify-between items-center">
          <Search
            placeholder="Rechercher des spécifications..."
            allowClear
            enterButton={<Button type="primary" icon={<SearchOutlined />}>Rechercher</Button>}
            size="large"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setLocalPage(1);
            }}
            className="w-full max-w-md"
          />
          
          <Button 
            type="primary" 
            onClick={() => fetchSpecs()}
            className="ml-4"
          >
            Actualiser
          </Button>
        </div>
      </div>
  
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Spécifications Produit</h1>
  
        {/* Products Grid */}
        <div className="mb-8">
          {filteredSpecs.length === 0 ? (
            <Empty
              description="Aucune spécification trouvée"
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
                      <Button 
                        type="primary" 
                        block
                        onClick={() => showSpecDetails(spec)}
                      >
                        Voir détails
                      </Button>,
                      spec.status !== 'published' && (
                        <Button 
                          type="dashed" 
                          block
                          onClick={() => showPublishConfirm(spec)}
                        >
                          Publier
                        </Button>
                      )
                    ].filter(Boolean)}
                  >
                    <Meta
                      title={<div className="truncate">{spec.display_name || spec.name}</div>}
                      description={
                        <div className="truncate text-gray-500" title={`Ref: ${spec.name}`}>
                          Ref: {spec.name}
                        </div>
                      }
                    />
                    <div className="mt-4">
                      {spec.attributes && Object.entries(spec.attributes)
                        .slice(0, 3) // Limite à 3 attributs
                        .map(([key, value]) => (
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
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Recherche IA</h2>
          <p className="text-gray-600 mb-6">Décrivez le produit recherché et notre IA trouvera les correspondances</p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Décrivez votre produit idéal..."
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
              Recherche IA
            </Button>
            {aiResults.length > 0 && (
              <Button
                size="large"
                onClick={handleClearAiResults}
                danger
              >
                Effacer
              </Button>
            )}
          </div>

          {/* AI Results */}
          {aiResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Résultats de recherche</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiResults.map((result, index) => (
                  <Card
                    key={index}
                    hoverable
                    className="h-full"
                    onClick={() => result.specId && showSpecDetails(
                      specs.find(s => s.sys_id === result.specId)
                    )}
                  >
                    <h4 className="text-blue-500 font-medium mb-2">{result.title}</h4>
                    <p className="text-gray-600 mb-4 text-sm">{result.description}</p>
                    {result.specId && (
                      <Button type="link" className="p-0">
                        Voir détails <ArrowRightOutlined />
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {isAiSearching && (
            <div className="flex justify-center py-6">
              <Spin tip="Recherche en cours..." />
            </div>
          )}

          {!isAiSearching && aiSearchTerm && aiResults.length === 0 && (
            <Empty
              description="Aucun résultat trouvé"
              className="flex flex-col items-center justify-center py-6"
            />
          )}
        </div>
      </div>

      {/* Détails Modal */}
      <Modal
        title={selectedSpec?.display_name || selectedSpec?.name}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Fermer
          </Button>,
          selectedSpec?.status !== 'published' && (
            <Button 
              key="publish" 
              type="primary"
              onClick={() => {
                setIsModalVisible(false);
                showPublishConfirm(selectedSpec);
              }}
            >
              Publier
            </Button>
          )
        ].filter(Boolean)}
        width={800}
      >
        {selectedSpec && (
          <div className="spec-details-modal">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <img
                  src={selectedSpec.image_url || defaultProductImage}
                  alt={selectedSpec.display_name}
                  className="w-full h-auto max-h-64 object-contain"
                  onError={(e) => { e.target.src = defaultProductImage }}
                />
              </div>
              <div className="w-full md:w-2/3">
                <h3 className="text-lg font-semibold mb-2">Référence: {selectedSpec.name}</h3>
                <p className="text-gray-600 mb-4">{selectedSpec.description || 'Pas de description disponible'}</p>
                
                <div className="attributes-grid">
                  {selectedSpec.attributes && Object.entries(selectedSpec.attributes).map(([key, value]) => (
                    <div key={key} className="attribute-item">
                      <span className="attribute-key">{key}:</span>
                      <span className="attribute-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Chatbot */}
      <div className="fixed bottom-8 right-8 z-50">
        <Chatbot />
      </div>
    </div>
  );
};

export default ProductSpecifications;
