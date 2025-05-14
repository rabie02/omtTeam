import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Pagination, Modal, Select } from 'antd';
import { getall, deleteCategory, updatecategoryStatus, createCatalogCategoryRelationship } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getall as getCatalogs } from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';
import PublishButton from './PublishButton';


function Table({ setData, setOpen, searchTerm }) {
    const [publishModal, setPublishModal] = useState({ 
        visible: false, 
        id: null, 
        currentStatus: null,
        selectedCatalog: null
    });
    
    const dispatch = useDispatch();
    const {
        data: products,
        loading,
        error,
        currentPage,
        totalItems,
        limit,
        relationshipStatus
    } = useSelector((state) => state.productOfferingCategory);
    
    // Get catalog data from Redux store
    const {
        data: catalogs,
        loading: loadingCatalogs
    } = useSelector((state) => state.productOfferingCatalog);

    // Fetch catalogs when the publish modal is opened
    useEffect(() => {
        if (publishModal.visible) {
            dispatch(getCatalogs({ page: 1, limit: 100 }));
        }
    }, [publishModal.visible, dispatch]);

    // Load initial data
    useEffect(() => {
        dispatch(getall({ page: 1, limit: 6 }));
    }, [dispatch]);

    // Listen for search term changes
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
    
    // Function to open the publish modal
    const showPublishModal = (id, currentStatus) => {
        setPublishModal({ 
            visible: true, 
            id, 
            currentStatus,
            selectedCatalog: null
        });
    };
    
    // Handle catalog selection in the modal
    const handleCatalogChange = (catalogId) => {
        setPublishModal({
            ...publishModal,
            selectedCatalog: catalogId
        });
    };
    
    // Handle publish with catalog relationship
    const handlePublish = async () => {
        try {
            // First, create catalog-category relationship if needed
            if (publishModal.currentStatus === 'draft' && publishModal.selectedCatalog) {
                try {
                    // Use the Redux action to create relationship
                    await dispatch(createCatalogCategoryRelationship({
                        catalogId: publishModal.selectedCatalog,
                        categoryId: publishModal.id
                    })).unwrap();
                } catch (relationshipError) {
                    console.error('Failed to create relationship:', relationshipError);
                    return; // Don't proceed with status update if relationship creation fails
                }
            }
            
            // Then update the status
            await dispatch(updatecategoryStatus({ 
                id: publishModal.id, 
                currentStatus: publishModal.currentStatus 
            })).unwrap();
            
            // Refresh data after status update
            dispatch(getall({ page: currentPage, limit, search: searchTerm }));
            
            // Close modal
            setPublishModal({ visible: false, id: null, currentStatus: null, selectedCatalog: null });
        } catch (error) {
            console.error('Failed to publish:', error);
        }
    };
    
    // Show a custom message for search
    const noProductsMessage = searchTerm 
        ? `No categories found matching "${searchTerm}"`
        : "No categories found";
      
    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    // Determine if catalog selection is needed (only when publishing from draft to published)
    const needsCatalogSelection = publishModal.currentStatus === 'draft';

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
                                                            {/* Status change button */}
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
                                                                title="Delete the category"
                                                                description="Are you sure to delete this category?"
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
            
            {/* Modal for status change with catalog selection if needed */}
            <Modal
                title={
                    <div className="flex items-center">
                        <span className="text-yellow-500 mr-2">
                            <i className="ri-error-warning-line text-xl"></i>
                        </span>
                        <span>
                            {publishModal.currentStatus === 'draft' 
                                ? 'Publish Category' 
                                : publishModal.currentStatus === 'published' 
                                    ? 'Retire Category' 
                                    : 'Update Status'}
                        </span>
                    </div>
                }
                open={publishModal.visible}
                onCancel={() => setPublishModal({ visible: false, id: null, currentStatus: null, selectedCatalog: null })}
                footer={[
                    <button
                        key="cancel"
                        onClick={() => setPublishModal({ visible: false, id: null, currentStatus: null, selectedCatalog: null })}
                        className="px-4 py-2 rounded border bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Cancel
                    </button>,
                    <button
                        key="ok"
                        onClick={handlePublish}
                        disabled={needsCatalogSelection && !publishModal.selectedCatalog}
                        className={`px-4 py-2 ml-2 rounded ${needsCatalogSelection && !publishModal.selectedCatalog 
                            ? 'bg-blue-300 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                    >
                        Confirm
                    </button>
                ]}
            >
                <p>
                    {publishModal.currentStatus === 'draft' 
                        ? 'Are you sure you want to publish this category?' 
                        : publishModal.currentStatus === 'published' 
                            ? 'Are you sure you want to retire this category?' 
                            : 'Are you sure you want to update the status of this category?'}
                </p>
                
                {/* Catalog selection - Only shown when publishing from draft */}
                {needsCatalogSelection && (
                    <div className="mt-4">
                        <label className="block font-medium mb-1">Select Catalog</label>
                        <Select
                            className="w-full"
                            value={publishModal.selectedCatalog}
                            onChange={handleCatalogChange}
                            loading={loadingCatalogs}
                            placeholder="Select a catalog"
                            options={catalogs.map(catalog => ({
                                value: catalog.sys_id,
                                label: catalog.name
                            }))}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            A catalog-category relationship must be created before publishing.
                        </p>
                    </div>
                )}
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