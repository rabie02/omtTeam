import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Tag, Table, Tooltip, notification } from 'antd';
import { getPriceList, deletePriceList } from '../../../features/servicenow/price-list/priceListSlice';

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
        try {
            await dispatch(deletePriceList(priceListId));
            notification.success({
                message: 'Price List Deleted',
                description: 'Price List has been deleted successfully',
            });
            dispatch(getPriceList());
        } catch (error) {
            console.error('Deletion failed:', error);
            notification.error({
                message: 'Deletion Failed',
                description: error.message || 'Failed to delete Price List. Please try again.',
            });
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => getValue(a.name).localeCompare(getValue(b.name)),
            render: (_, record) => getValue(record.name),
        },
        {
            title: 'Currency',
            dataIndex: 'currency',
            key: 'currency',
            sorter: (a, b) => getValue(a.currency).localeCompare(getValue(b.currency)),
            render: (_, record) => getValue(record.currency),
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            key: 'start_date',
            sorter: (a, b) => {
                const dateA = getValue(a.start_date) || '';
                const dateB = getValue(b.start_date) || '';
                return dateA.localeCompare(dateB);
            },
            render: (_, record) => (
                getValue(record.start_date) 
                    ? new Date(getValue(record.start_date)).toISOString().split("T")[0] 
                    : 'N/A'
            ),
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            key: 'end_date',
            sorter: (a, b) => {
                const dateA = getValue(a.end_date) || '';
                const dateB = getValue(b.end_date) || '';
                return dateA.localeCompare(dateB);
            },
            render: (_, record) => (
                getValue(record.end_date) 
                    ? new Date(getValue(record.end_date)).toISOString().split("T")[0] 
                    : 'N/A'
            ),
        },
        {
            title: 'Default',
            dataIndex: 'defaultflag',
            key: 'defaultflag',
            sorter: (a, b) => getValue(a.defaultflag).localeCompare(getValue(b.defaultflag)),
            render: (_, record) => (
                getValue(record.defaultflag) === 'true' 
                    ? <Tag color="green">Yes</Tag> 
                    : <Tag color="gray">No</Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Tooltip title="Delete price list">
                    <Popconfirm
                        title="Delete the price list"
                        description="Are you sure to delete this price list?"
                        icon={<i className="ri-error-warning-line text-red-600 mr-2"></i>}
                        onConfirm={() => handleDelete(getValue(record._id))}
                    >
                        <button className="text-gray-500 hover:text-red-600">
                            <i className="ri-delete-bin-6-line text-2xl"></i>
                        </button>
                    </Popconfirm>
                </Tooltip>
            ),
        },
    ];

    if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
    if (error) {
        notification.error({
                message: 'Operation Failed',
                description: error.message || 'Failure at the execution. Please try again later.',
            });
    }
    return (
        <div className='w-full justify-center flex'>
            <div className="w-9/12">
                <Table
                    columns={columns}
                    dataSource={priceLists}
                    rowKey={(record) => getValue(record._id)}
                    pagination={{
                        pageSize: 6,
                        showSizeChanger: false,
                        }}
                    showSorterTooltip={{ title: 'Click to sort' }}
                    locale={{
                        emptyText: <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No price lists found"
                        />
                    }}
                    //className="border border-gray-300 shadow-2xl"
                />
            </div>
        </div>
    );
}

export default PriceListTable;