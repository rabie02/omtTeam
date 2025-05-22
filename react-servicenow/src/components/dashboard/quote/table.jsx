import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Empty, Spin, Pagination } from 'antd';
import { getQuotes } from '../../../features/servicenow/quote/quotaSlice'; // Fixed import

function Table({ setData, setOpen, searchQuery }) {
    const dispatch = useDispatch();
    const {
        data,
        loading,
        error,
        page: currentPage,  // Match slice state name
        total,
        limit
    } = useSelector((state) => state.quotes);

    useEffect(() => {
        dispatch(getQuotes({  // Changed to getQuotes
            page: 1,
            limit: 6,
            q: searchQuery
        }));
    }, [dispatch, searchQuery]);

    const handlePageChange = (page, pageSize) => {
        dispatch(getQuotes({  // Changed to getQuotes
            page,
            limit: pageSize,
            q: searchQuery
        }));
    };

    const seeData = (newData) => {
        setData(newData);
        setOpen(true);
    };

    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className='w-full justify-center flex'>
            <div className="w-9/12">
                <table className="divide-y-2 min-w-full divide-gray-200 overflow-x-auto border border-gray-300 shadow-2xl">
                    <thead className="ltr:text-left rtl:text-right bg-cyan-700 text-white">
                        <tr className="*:font-medium ">
                            <th className="px-3 py-3 whitespace-nowrap">Number</th>
                            <th className="px-3 py-3 whitespace-nowrap">Version</th>
                            <th className="px-3 py-3 whitespace-nowrap">Description</th>
                            <th className="px-3 py-3 whitespace-nowrap">Status</th>
                            <th className="px-3 py-3 whitespace-nowrap">Client</th>
                            <th className="px-3 py-3 whitespace-nowrap">Assigned To</th>
                            <th className="px-3 py-3 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {data?.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-8 text-center">
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No quotes found"
                                    />
                                </td>
                            </tr>
                        ) : (
                            data?.map((quote) => (
                                <tr key={quote.id} className="*:text-gray-900 *:first:font-medium">
                                    <td className="px-3 py-3 whitespace-nowrap">{quote.number}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{quote.version}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">{quote.short_description||''}</td>
                                    <td className="px-3 py-3 whitespace-nowrap capitalize">
                                        {quote.state || <span className='text-gray-400'>< i class="ri-subtract-fill text-2xl"></i></span>}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                         {quote.account || <span className='text-gray-400'>< i class="ri-subtract-fill text-2xl"></i></span>}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        {quote.assigned_to || <span className='text-gray-400'>< i class="ri-subtract-fill text-2xl"></i></span>}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <button
                                            className="mx-2 text-gray-500 hover:text-yellow-400"
                                            onClick={() => seeData(quote)}
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
                        total={total}
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