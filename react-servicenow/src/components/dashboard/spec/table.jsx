import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Spin, Pagination, Modal, Input, Tag, Button, Descriptions } from 'antd';
import { getPublished } from '../../../features/servicenow/product-specification/productSpecificationSlice';
import axios from 'axios';
import { SearchOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

function Table({ setData, setOpen, searchQuery }) {
  const dispatch = useDispatch();
  const {
    data,
    loading,
    error,
    currentPage,
    totalItems,
    limit
  } = useSelector((state) => state.productSpecification);

  const [offerings, setOfferings] = useState([]);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [currentSpec, setCurrentSpec] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageModal, setCurrentPageModal] = useState(1);
  const [expandedOffers, setExpandedOffers] = useState([]);

  const filteredOfferings = offerings.filter(offering =>
    offering.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offering.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offering.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    dispatch(getPublished({
      page: 1,
      limit: 6,
      q: searchQuery
    }));
  }, [dispatch, searchQuery]);

  const handlePageChange = (page, pageSize) => {
    dispatch(getPublished({
      page,
      limit: pageSize,
      q: searchQuery
    }));
  };

  const seeData = (newData) => {
    setData(newData);
    setOpen(true);
  };

  const fetchOfferings = async (specSysId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error("❌ Aucun token trouvé dans localStorage !");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/product-offering/by-spec/${specSysId}`,
        {
          headers: {
            Authorization: token
          }
        }
      );

      // Transformation des données pour inclure les champs nécessaires
      const transformedData = response.data.data.map(item => ({
        ...item,
        validFor: item.validFor || {
          startDateTime: item.start_date || null,
          endDateTime: item.end_date || null
        },
        // Récupération du prix récurrent s'il existe
        recurringPrice: item.productOfferingPrice?.find(p => p.priceType === 'recurring')?.price?.taxIncludedAmount || null
      }));

      setOfferings(transformedData);
      setIsOfferingModalOpen(true);
      setExpandedOffers([]);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des offerings :", error);
    }
  };

  const toggleExpandOffer = (offerId) => {
    setExpandedOffers(prev => 
      prev.includes(offerId) 
        ? prev.filter(id => id !== offerId) 
        : [...prev, offerId]
    );
  };

  if (loading) return <div className='h-full flex justify-center items-center'><Spin size="large" /></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className='w-full justify-center flex'>
      <div className="w-9/12">
        <table className="divide-y-2 min-w-full divide-gray-200 overflow-x-auto border border-gray-300 shadow-2xl">
          <thead className="ltr:text-left rtl:text-right bg-cyan-700 text-white">
            <tr className="*:font-medium ">
              <th className="px-3 py-3 whitespace-nowrap">Name</th>
              <th className="px-3 py-3 whitespace-nowrap">Type</th>
              <th className="px-3 py-3 whitespace-nowrap">Start Date</th>
              <th className="px-3 py-3 whitespace-nowrap">End Date</th>
              <th className="px-3 py-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data?.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No specifications found"
                  />
                </td>
              </tr>
            ) : (
              data.map((product) => ( product !== undefined &&
                <tr key={product.sys_id} className="*:text-gray-900 *:first:font-medium">
                  <td className="px-3 py-3 whitespace-nowrap">{product.display_name || product.displayName}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{product.specification_type || 'None'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                   {product.start_date ? new Date(product.start_date).toISOString().split("T")[0] : ( product.validFor.startDateTime ? new Date(product.validFor.startDateTime).toISOString().split("T")[0] : 'N/A')}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {product.end_date ? new Date(product.end_date).toISOString().split("T")[0] : ( product.validFor?.endDateTime ? new Date(product.validFor.endDateTime).toISOString().split("T")[0] : 'N/A')}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <button
                      className="mx-2 text-gray-500 hover:text-yellow-400"
                      onClick={() => seeData(product)}
                    >
                      <i className="ri-eye-line text-2xl"></i>
                    </button>
                    <button
                      className="mx-2 text-gray-500 hover:text-blue-500"
                      onClick={() => {
                        setCurrentSpec(product);
                        fetchOfferings(product.sys_id);
                      }}
                    >
                      <i className="ri-links-line text-2xl" title="Voir les offres liées"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="mt-5 flex justify-end ">
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={limit}
            onChange={handlePageChange}
            showSizeChanger={false}
            disabled={loading}
            className="ant-pagination-custom"
          />
        </div>
      </div>

      {/* Modal pour les offres liées */}
      <Modal
        title={
          <div className="flex items-center">
            <span className="text-xl font-semibold" style={{ color: '#005B70' }}>
              Offres liées à: <span className="font-bold">{currentSpec?.display_name || currentSpec?.displayName || ''}</span>
            </span>
          </div>
        }
        open={isOfferingModalOpen}
        onCancel={() => setIsOfferingModalOpen(false)}
        footer={null}
        width={800}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <div className="mb-6">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Rechercher une offre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className="w-full"
            size="large"
          />
        </div>

        {filteredOfferings.length > 0 ? (
          <div className="space-y-3">
            {filteredOfferings
              .slice((currentPageModal - 1) * 5, currentPageModal * 5)
              .map((item) => (
                <div key={item.sys_id || item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpandOffer(item.sys_id || item.id)}
                  >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <h3 className="font-medium text-gray-800 text-base sm:text-lg">
                        {item.display_name || item.displayName || item.name || 'Nom inconnu'}
                      </h3>
                      <span className={`px-2 py-1 text-xs sm:text-sm rounded capitalize 
                        ${
                          item.status === 'published' || item.status === 'Published' 
                            ? 'bg-green-100 text-green-800 border border-green-200' :
                          item.status === 'draft' || item.status === 'In Draft' 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          item.status === 'archived' || item.status === 'Archived' 
                            ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`
                      }>
                        {item.status || 'Inconnu'}
                      </span>
                    </div>
                    <Button 
                      type="text" 
                      icon={expandedOffers.includes(item.sys_id || item.id) ? <MinusOutlined /> : <PlusOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandOffer(item.sys_id || item.id);
                      }}
                    />
                  </div>

                  {expandedOffers.includes(item.sys_id || item.id) && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Date de début">
                          {item.start_date 
                            ? new Date(item.start_date).toLocaleDateString()
                            : (item.validFor?.startDateTime 
                                ? new Date(item.validFor.startDateTime).toLocaleDateString()
                                : 'N/A')}
                        </Descriptions.Item>
                        
                        {item.description && (
                          <Descriptions.Item label="Description">
                            {item.description}
                          </Descriptions.Item>
                        )}
                        
                        {item.productOfferingTerm && (
                          <Descriptions.Item label="Terme">
                            {item.productOfferingTerm.replace(/_/g, ' ')}
                          </Descriptions.Item>
                        )}
                        
                        {item.recurringPrice && (
                          <Descriptions.Item label="Prix récurrent">
                            {`${item.recurringPrice.value} ${item.recurringPrice.unit}`}
                          </Descriptions.Item>
                        )}
                        
                        {item.externalId && (
                          <Descriptions.Item label="ID Externe">
                            {item.externalId}
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </div>
                  )}
                </div>
              ))}

            <div className="mt-6 flex justify-center">
              <Pagination
                current={currentPageModal}
                pageSize={5}
                total={filteredOfferings.length}
                onChange={(page) => setCurrentPageModal(page)}
                showSizeChanger={false}
              />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-500">
                  {searchTerm ? 'Aucun résultat trouvé' : 'Aucune offre liée trouvée'}
                </span>
              }
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Table;
