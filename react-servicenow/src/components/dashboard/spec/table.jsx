import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Spin, Pagination } from 'antd';
import { getPublished } from '../../../features/servicenow/product-specification/productSpecificationSlice';

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
                            data?.map((product) => (
                                <tr key={product.number} className="*:text-gray-900 *:first:font-medium">
                                    
                                    <td className="px-3 py-3 whitespace-nowrap">{product.display_name || product.displayName}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{product.specification_type?product.specification_type : <p className=''>None</p> }</td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        {product.start_date ? new Date(product.start_date).toISOString().split("T")[0] : 'N/A'}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        {product.end_date ? new Date(product.end_date).toISOString().split("T")[0] : 'N/A'}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <button
                                            className="mx-2 text-gray-500 hover:text-yellow-400"
                                            onClick={() => seeData(product)}

                                        >
                                            <i className="ri-eye-line text-2xl"></i>
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
        </div>
    );
}

export default Table;