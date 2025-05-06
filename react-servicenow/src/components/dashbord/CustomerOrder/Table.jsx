import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Pagination } from 'antd';
import {
    getall,
    
} from '../../../features/servicenow/customer-order/customerOrderSlice';

function Table({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data,
        loading,
        error,
    } = useSelector((state) => state.customerOrder);

    useEffect(() => {
        // Include searchQuery in the API call
        dispatch(getall());
    }, [dispatch]); // Add searchQuery to dependencies

    const handleDelete = async (id) => {      
        await dispatch(deleteCatalog(id));
        // Refresh with current search and pagination
        dispatch(getall());
    };

    const handlePageChange = (page) => {
        dispatch(getall());
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
                            <th className="px-3 py-3 whitespace-nowrap">Customer</th>
                            <th className="px-3 py-3 whitespace-nowrap">Product Offering</th>
                            <th className="px-3 py-3 whitespace-nowrap">Prod spec</th>
                            <th className="px-3 py-3 whitespace-nowrap">Order State</th>
                            <th className="px-3 py-3 whitespace-nowrap">Order Date</th>
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
                            data.map((order) => (
                                <tr key={order.id} className="*:text-gray-900 *:first:font-medium">
                                    <td className="px-3 py-3 whitespace-nowrap">{order.relatedParty[0]?.name}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{ order.productOrderItem[0]?.productOffering?.name}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{order.productOrderItem[0]?.product.productSpecification.name}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-md capitalize rounded ${order.state === 'draft' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {order.state}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        {order.orderDate ? new Date(order.orderDate).toISOString().split("T")[0] : 'N/A'}
                                    </td>
                                    
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <button
                                            className="mr-2 text-gray-500 hover:text-yellow-400 "
                                            onClick={() => changeData(order)}
                                        >
                                            <i className="ri-pencil-line text-2xl"></i>
                                        </button>
                                        <Popconfirm
                                            title="Delete the catalog"
                                            description="Are you sure to delete this catalog?"
                                            icon={<i className="ri-error-warning-line text-red-600 mr-2"></i>}
                                            onConfirm={() => handleDelete(order.id)}
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
                        // current={currentPage}
                        // total={totalItems}
                        // pageSize={limit}
                        // onChange={handlePageChange}
                        // showSizeChanger={false}
                        disabled={loading}
                        className="ant-pagination-custom"
                    />
                </div>
            </div>
        </div>
    );
}

export default Table;