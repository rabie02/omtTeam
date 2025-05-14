import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Pagination, Spin, Empty } from 'antd';
import { getall, deleteProductOffering, updateProductOfferingStatus } from '../../../features/servicenow/product-offering/productOfferingSlice';

function Table({setData , setOpen, searchQuery}) {
    const dispatch = useDispatch();
            const {
                data: products,
                loading,
                error,
                currentPage,
                totalItems,
                limit
            } = useSelector((state) => state.productOffering);
    
    useEffect(() => {
        dispatch(getall({ page: 1, limit: 6, q:searchQuery }));
    }, [dispatch, searchQuery]);
    

    const handleDelete = async (productId) => {
        await dispatch(deleteProductOffering(productId));
        // Refresh current page after deletion
        dispatch(getall({ page: currentPage, limit, q:searchQuery }));
    };

     const handleUpdateStatus = async (productId, newStatus) => {     
        await dispatch(updateProductOfferingStatus({ 
            sys_id: productId, 
            status: newStatus 
        }));
        dispatch(getall({ 
            page: currentPage, 
            limit,
            q: searchQuery 
        }));
    };

    function changeData(newData) {
        setData(newData)
        setOpen(true)
      }

    const handlePageChange = (page) => {
            dispatch(getall({ page, limit, q:searchQuery }));
        };


    const getStatusAction = (currentStatus) => {
        switch (currentStatus.toLowerCase()) {
            case 'draft':
                return { action: 'Publish', newStatus: 'published' };
            case 'published':
                return { action: 'Retire', newStatus: 'retired' };
            case 'retired':
                return { action: 'Archive', newStatus: 'archived' };
            default:
                return { action: 'Update Status', newStatus: currentStatus };
        }
    };
    

    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
    
    return (
        <div className='w-full justify-center flex'>
            <div className="w-9/12">
                <table className=" divide-y-2 min-w-full divide-gray-200 overflow-x-auto border border-gray-300  shadow-2xl">
                    <thead className="ltr:text-left rtl:text-right bg-cyan-700 text-white">
                        <tr className="*:font-medium ">
                        <th className="px-3 py-3 whitespace-nowrap">Name</th>
                        <th className="px-3 py-3 whitespace-nowrap">Product Specification</th>
                        <th className="px-3 py-3 whitespace-nowrap">Status</th>
                        <th className="px-3 py-3 whitespace-nowrap">Start Date</th>
                        <th className="px-3 py-3 whitespace-nowrap">End Date</th>
                        <th className="px-3 py-3 whitespace-nowrap">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                    {products.length > 0 ? products?.map((product) => ( product !== undefined ?
                        <tr key={product.id} className="*:text-gray-900 *:first:font-medium">
                            
                            <td className="px-3 py-3 whitespace-nowrap">{product.name}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{product.productSpecification?.name}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs capitalize rounded ${product.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {product.status}
                                </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">{product.validFor?.startDateTime || 'N/A'}</td>
                            <td className="px-3 py-3 whitespace-nowrap">{product.validFor?.endDateTime || 'N/A'}</td>
                            <td className="px-3 py-3 whitespace-nowrap">

                                <Popconfirm
                                    title={`${getStatusAction(product.status).action} Product offering`}
                                    description={`Are you sure you want to ${getStatusAction(product.status).action.toLowerCase()} this product offering?`}
                                    icon={<i className="ri-error-warning-line text-yellow-600 text-md mr-2"></i>}
                                    onConfirm={() => handleUpdateStatus(product.id, getStatusAction(product.status).newStatus)}
                                >
                                    <button className="text-gray-500 hover:text-green-600">
                                        <i className="ri-loop-right-line text-2xl"></i>
                                    </button>
                                </Popconfirm>
                                <button
                                    className="mx-2 text-gray-500 hover:text-blue-600 "
                                    onClick={() => changeData(product)}
                                >
                                    <i className="ri-pencil-line text-2xl"></i>
                                </button>


                                <Popconfirm
                                    title="Delete the catalog"
                                    description="Are you sure to delete this catalog?"
                                    icon={<i className="ri-error-warning-line text-red-600 mr-2"></i>}
                                    onConfirm={() => handleDelete(product.id)}
                                >
                                    <button
                                        className="text-gray-500 hover:text-red-600 "
                                    >
                                        <i className="ri-delete-bin-6-line text-2xl"></i>
                                    </button>
                                </Popconfirm>

                            </td>
                        </tr> : ""
                    )) : <tr>
                    <td colSpan="6" className="py-8 text-center">
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No catalogs found"
                        />
                    </td>
                </tr>}
                </tbody>
            </table>
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