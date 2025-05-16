import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Tag } from 'antd';
import { getPriceList } from '../../../features/servicenow/opportunity/opportunitySlice';

function PriceListTable({ setData, setOpen }) {
    const dispatch = useDispatch();
    const { priceLists, loading, error } = useSelector((state) => state.priceList);

    useEffect(() => {
        dispatch(getPriceList());
    }, [dispatch]);

    // Helper function to extract value from ServiceNow object format
    const getValue = (field) => {
        if (!field) return '';
        return typeof field === 'object' ? field.value : field;
    };

    const handleDelete = async (priceListId) => {
        // You'll need to add deletePriceList to your slice
        // await dispatch(deletePriceList(priceListId));
        // dispatch(getPriceList());
    };

    const handleUpdateState = async (priceListId, newState) => {
        // You'll need to add updatePriceListState to your slice
        // await dispatch(updatePriceListState({
        //     id: priceListId,
        //     state: newState
        // }));
        // dispatch(getPriceList());
    };

    const changeData = (newData) => {
        setData(newData);
        setOpen(true);
    };

    const getStateAction = (currentState) => {
        const state = getValue(currentState);
        switch (state?.toLowerCase()) {
            case 'draft':
                return { action: 'Publish', newState: 'published' };
            case 'published':
                return { action: 'Archive', newState: 'archived' };
            default:
                return { action: 'Update State', newState: state };
        }
    };

    const getStateColor = (state) => {
        const stateValue = getValue(state);
        switch (stateValue?.toLowerCase()) {
            case 'published':
                return 'green';
            case 'draft':
                return 'blue';
            case 'archived':
                return 'gray';
            default:
                return 'orange';
        }
    };

    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;
    
    return (
        <div className='w-full justify-center flex'>
            <div className="w-9/12">
                <table className="divide-y-2 min-w-full divide-gray-200 overflow-x-auto border border-gray-300 shadow-2xl">
                    <thead className="ltr:text-left rtl:text-right bg-cyan-700 text-white">
                        <tr className="*:font-medium ">
                            <th className="px-3 py-3 whitespace-nowrap">Name</th>
                            <th className="px-3 py-3 whitespace-nowrap">Currency</th>
                            <th className="px-3 py-3 whitespace-nowrap">State</th>
                            <th className="px-3 py-3 whitespace-nowrap">Start Date</th>
                            <th className="px-3 py-3 whitespace-nowrap">End Date</th>
                            <th className="px-3 py-3 whitespace-nowrap">Default</th>
                            <th className="px-3 py-3 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {!priceLists || priceLists.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-8 text-center">
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No price lists found"
                                    />
                                </td>
                            </tr>
                        ) : (
                            priceLists.map((priceList) => {
                                const { action, newState } = getStateAction(priceList.state);
                                
                                return (
                                    <tr key={getValue(priceList.sys_id)} className="*:text-gray-900 *:first:font-medium">
                                        <td className="px-3 py-3 whitespace-nowrap">{getValue(priceList.name)}</td>
                                        <td className="px-3 py-3 whitespace-nowrap">{getValue(priceList.currency)}</td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <Tag color={getStateColor(priceList.state)} className="capitalize">
                                                {getValue(priceList.state)}
                                            </Tag>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {getValue(priceList.start_date) ? new Date(getValue(priceList.start_date)).toISOString().split("T")[0] : 'N/A'}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {getValue(priceList.end_date) ? new Date(getValue(priceList.end_date)).toISOString().split("T")[0] : 'N/A'}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {getValue(priceList.defaultflag) === 'true' ? (
                                                <Tag color="green">Yes</Tag>
                                            ) : (
                                                <Tag color="gray">No</Tag>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <Popconfirm
                                                title={`${action} Price List`}
                                                description={`Are you sure you want to ${action.toLowerCase()} this price list?`}
                                                icon={<i className="ri-error-warning-line text-yellow-600 text-md mr-2"></i>}
                                                onConfirm={() => handleUpdateState(getValue(priceList.sys_id), newState)}
                                                disabled={true} // Disabled until you implement update
                                            >
                                                <button className="text-gray-500 hover:text-green-600">
                                                    <i className="ri-loop-right-line text-2xl"></i>
                                                </button>
                                            </Popconfirm>
                                            <button
                                                className="mx-2 text-gray-500 hover:text-yellow-400"
                                                onClick={() => changeData(priceList)}
                                            >
                                                <i className="ri-pencil-line text-2xl"></i>
                                            </button>
                                            <Popconfirm
                                                title="Delete the price list"
                                                description="Are you sure to delete this price list?"
                                                icon={<i className="ri-error-warning-line text-red-600 mr-2"></i>}
                                                onConfirm={() => handleDelete(getValue(priceList.sys_id))}
                                                disabled={true} // Disabled until you implement delete
                                            >
                                                <button className="text-gray-500 hover:text-red-600">
                                                    <i className="ri-delete-bin-6-line text-2xl"></i>
                                                </button>
                                            </Popconfirm>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PriceListTable;