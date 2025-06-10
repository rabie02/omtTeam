import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Spin, Pagination, Modal, List } from 'antd';
import { getPublished } from '../../../features/servicenow/product-specification/productSpecificationSlice';
import axios from 'axios';

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
    const token = localStorage.getItem('access_token'); // ✅ bonne clé utilisée

    if (!token) {
      console.error("❌ Aucun token trouvé dans localStorage !");
      return;
    }

    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/product-offering/by-spec/${specSysId}`,
      {
        headers: {
          Authorization: token // ✅ déjà formaté en Bearer ...
        }
      }
    );

    setOfferings(response.data.data);
    setIsOfferingModalOpen(true);
  } catch (error) {
    console.error("❌ Erreur lors du chargement des offerings :", error);
  }
};


console.log(data);

  if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
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

      {/* Modal affichant les offerings */}
{/* Modal affichant les offerings */}
<Modal
  title={`Offres liées à : ${currentSpec?.display_name || (currentSpec?.displayName || '')}`}
  open={isOfferingModalOpen}
  onCancel={() => setIsOfferingModalOpen(false)}
  footer={null}
  width={700}
>
  {/* Recherche */}
  <input
    type="text"
    placeholder="Rechercher une offre..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full p-2 mb-4 border border-gray-300 rounded"
  />

  {/* Pagination + filtre */}
  {filteredOfferings.length > 0 ? (
    <>
      <List
        itemLayout="vertical"
        dataSource={filteredOfferings.slice((currentPage - 1) * 10, currentPage * 10)}
        renderItem={(item) => (
          <List.Item key={item.sys_id}>
            <List.Item.Meta title={item.display_name || (item.displayName || 'Nom inconnu')} />
          </List.Item>
        )}
      />
      <div className="mt-4 flex justify-center">
        <Pagination
          current={currentPage}
          pageSize={10}
          total={filteredOfferings.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>
    </>
  ) : (
    <p>Aucune offre liée trouvée.</p>
  )}
</Modal>


    </div>
  );
}

export default Table;
