import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Pagination, Modal } from 'antd';
import { getall, deleteCategory, updatecategoryStatus } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';

function Table({ setData, setOpen, searchTerm }) {
    const [publishModal, setPublishModal] = useState({ visible: false, id: null, currentStatus: null });
    
    const dispatch = useDispatch();
    const {
        data: products,
        loading,
        error,
        currentPage,
        totalItems,
        limit
    } = useSelector((state) => state.productOfferingCategory);

    // Charge les données initiales
    useEffect(() => {
        dispatch(getall({ page: 1, limit: 6 }));
    }, [dispatch]);

    // Écoute les changements du terme de recherche
    useEffect(() => {
        if (searchTerm !== undefined) {
            dispatch(getall({ page: 1, limit: 6, search: searchTerm }));
        }
    }, [dispatch, searchTerm]);
      
    const handleDelete = async (productId) => {
        await dispatch(deleteCategory(productId));
        // Refresh current page after deletion
        dispatch(getall({ page: currentPage, limit, search: searchTerm }));
    };

    const handlePageChange = (page) => {
        dispatch(getall({ page, limit, search: searchTerm }));
    };
  
    const changeData = (newData) => {
        setData(newData);
        setOpen(true);
    };
    
    // Nouvelle fonction pour ouvrir la modal de publication
    const showPublishModal = (id, currentStatus) => {
        setPublishModal({ visible: true, id, currentStatus });
    };
    
    // Gérer la publication
    const handlePublish = async () => {
        try {
            await dispatch(updatecategoryStatus({ 
                id: publishModal.id, 
                currentStatus: publishModal.currentStatus 
            })).unwrap();
            
            // Refresh data after status update
            dispatch(getall({ page: currentPage, limit, search: searchTerm }));
            
            // Close modal
            setPublishModal({ visible: false, id: null, currentStatus: null });
        } catch (error) {
            console.error('Failed to publish:', error);
        }
    };
    
    // Afficher un message personnalisé pour la recherche
    const noProductsMessage = searchTerm 
        ? `Aucune catégorie trouvée correspondant à "${searchTerm}"`
        : "Aucune catégorie trouvée";
      
    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className='w-full justify-center flex'>
        <div className="w-9/12 ">
        <table className=" divide-y-2 min-w-full divide-gray-200 overflow-x-auto border border-gray-300  shadow-2xl">
                    <thead className="ltr:text-left rtl:text-right bg-cyan-700 text-white">
                        <tr className="*:font-medium ">
                            <th className="px-3 py-3 whitespace-nowrap">Number</th>
                            <th className="px-3 py-3 whitespace-nowrap">Name</th>
                            <th className="px-3 py-3 whitespace-nowrap">Status</th>
                            <th className="px-3 py-3 whitespace-nowrap">Start Date</th>
                            <th className="px-3 py-3 whitespace-nowrap">End Date</th>
                            <th className="px-3 py-3 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>

                <tbody className="divide-y divide-gray-200">
                    {!products || products.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="py-8 text-center">
                                                        <Empty
                                                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                              description={noProductsMessage}
                                                        />
                                                    </td>
                                                </tr>
                                            ) : (
                                                products.map((product) => (
                                                    <tr key={product.number} className="*:text-gray-900 *:first:font-medium">
                                                        <td className="px-3 py-3 whitespace-nowrap">{product.number}</td>
                                                        <td className="px-3 py-3 whitespace-nowrap">{product.name}</td>
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-md capitalize rounded ${product.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                {product.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            {product.start_date ? new Date(product.start_date).toISOString().split("T")[0] : 'N/A'}
                                                        </td>
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            {product.end_date ? new Date(product.end_date).toISOString().split("T")[0] : 'N/A'}
                                                        </td>
                                                        <td className="px-3 py-3 whitespace-nowrap">
                                                            {/* Nouveau bouton de publication */}
                                                            <button
                                                                className="mr-2 text-gray-500 hover:text-green-500"
                                                                onClick={() => showPublishModal(product.sys_id, product.status)}
                                                            >
                                                                <i className="ri-refresh-line text-2xl"></i>
                                                            </button>
                                                            <button
                                                                className="mr-2 text-gray-500 hover:text-yellow-400 "
                                                                onClick={() => changeData(product)}
                                                            >
                                                                <i className="ri-pencil-line text-2xl"></i>
                                                            </button>
                                                            <Popconfirm
                                                                title="Delete the catalog"
                                                                description="Are you sure to delete this catalog?"
                                                                icon={<i className="ri-error-warning-line text-red-600 mr-2"></i>}
                                                                onConfirm={() => handleDelete(product.sys_id)}
                                                            >
                                                                <button className="text-gray-500 hover:text-red-600 ">
                                                                    <i className="ri-delete-bin-6-line text-2xl"></i>
                                                                </button>
                                                            </Popconfirm>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}

                </tbody>
            </table>
            
            {/* Modal de confirmation de publication */}
            <Modal
                title={
                    <div className="flex items-center">
                        <span className="text-yellow-500 mr-2">
                            <i className="ri-error-warning-line text-xl"></i>
                        </span>
                        <span>Publish Catalog</span>
                    </div>
                }
                open={publishModal.visible}
                onCancel={() => setPublishModal({ visible: false, id: null, currentStatus: null })}
                footer={[
                    <button
                        key="cancel"
                        onClick={() => setPublishModal({ visible: false, id: null, currentStatus: null })}
                        className="px-4 py-2 rounded border bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Cancel
                    </button>,
                    <button
                        key="ok"
                        onClick={handlePublish}
                        className="px-4 py-2 ml-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                    >
                        OK
                    </button>
                ]}
            >
                <p>Are you sure you want to publish this catalog?</p>
            </Modal>
            
            <div className=" mt-5 flex justify-end ">
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

        </div>
    );
}

export default Table;