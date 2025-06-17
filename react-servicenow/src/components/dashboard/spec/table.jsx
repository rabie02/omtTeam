import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Spin, Pagination, Modal, List, Input } from 'antd';
import { getPublished } from '../../../features/servicenow/product-specification/productSpecificationSlice';
import axios from 'axios';
import { SearchOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons';

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

  const filteredOfferings = offerings.filter(offering =>
    offering.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

      setOfferings(response.data.data);
      setIsOfferingModalOpen(true);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des offerings :", error);
    }
  };

  if (loading) return <div className='h-full flex justify-center items-center'><Spin size="large" /></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className='w-full'>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#0078ae] text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data?.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No specifications found"
                  />
                </td>
              </tr>
            ) : (
              data.map((product) => ( product !== undefined &&
                <tr key={product.sys_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.display_name || product.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.specification_type || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.start_date ? new Date(product.start_date).toISOString().split("T")[0] : ( product.validFor.startDateTime ? new Date(product.validFor.startDateTime).toISOString().split("T")[0] : 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.end_date ? new Date(product.end_date).toISOString().split("T")[0] : ( product.validFor?.endDateTime ? new Date(product.validFor.endDateTime).toISOString().split("T")[0] : 'N/A')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => seeData(product)}
                        className="text-gray-600 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <EyeOutlined className="text-lg" />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentSpec(product);
                          fetchOfferings(product.sys_id);
                        }}
                        className="text-gray-600 hover:text-green-600 transition-colors"
                        title="View linked offers"
                      >
                        <LinkOutlined className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {data?.length} of {totalItems} items
          </div>
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

      {/* Modal for linked offerings */}
      <Modal
        title={
          <div className="flex items-center">
            <LinkOutlined className="mr-2 text-[#0078ae]" />
            <span className="font-semibold">Offres liées à : {currentSpec?.display_name || currentSpec?.displayName || ''}</span>
          </div>
        }
        open={isOfferingModalOpen}
        onCancel={() => setIsOfferingModalOpen(false)}
        footer={null}
        width={700}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Rechercher une offre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
          allowClear
        />

        {filteredOfferings.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <List
              itemLayout="horizontal"
              dataSource={filteredOfferings.slice((currentPageModal - 1) * 10, currentPageModal * 10)}
              renderItem={(item) => (
                <List.Item className="px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-[#0078ae] mr-3"></div>
                    <span className="font-medium">{item.display_name || item.displayName || 'Nom inconnu'}</span>
                  </div>
                </List.Item>
              )}
            />
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-center">
              <Pagination
                current={currentPageModal}
                pageSize={10}
                total={filteredOfferings.length}
                onChange={(page) => setCurrentPageModal(page)}
                simple
              />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Aucune offre liée trouvée"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Table;
