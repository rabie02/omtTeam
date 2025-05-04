import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Pagination } from 'antd';
import {
    getall,
    deleteCatalog
} from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';

function Table({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data,
        loading,
        error,
        currentPage,
        totalItems,
        limit
    } = useSelector((state) => state.productOfferingCatalog);

    useEffect(() => {
        // Include searchQuery in the API call
        dispatch(getall({ page: 1, limit: 6, q: searchQuery }));
    }, [dispatch, searchQuery]); // Add searchQuery to dependencies

    const handleDelete = async (productId) => {      
        await dispatch(deleteCatalog(productId));
        // Refresh with current search and pagination
        dispatch(getall({ 
            page: currentPage, 
            limit,
            q: searchQuery 
        }));
    };

    const handlePageChange = (page) => {
        dispatch(getall({ 
            page, 
            limit,
            q: searchQuery 
        }));
    };

    const changeData = (newData) => {
        setData(newData);
        setOpen(true);
    };

    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
    
    return (
        <div className='w-full justify-center flex'>
            <div className="w-9/12">
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
                        {!data || data.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center">
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No catalogs found"
                                    />
                                </td>
                            </tr>
                        ) : (
                            data.map((product) => (
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
                                            onConfirm={() => handleDelete(product._id)}
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
        </div>
    );
}

export default Table;