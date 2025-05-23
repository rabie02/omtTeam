import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Table, notification, Tooltip} from 'antd';
import { 
  getOpportunities,
  deleteOpportunity,
  getAccounts
} from '../../../features/servicenow/opportunity/opportunitySlice';


function OpportunityTable({ setOpenForm }) {
  const dispatch = useDispatch();
  const {
    opportunities,
    accounts,
    loading,
    error
  } = useSelector((state) => state.opportunity);

  useEffect(() => {
    dispatch(getOpportunities());
    dispatch(getAccounts());
  }, [dispatch]);
  
  const handleDelete = async (opportunityId) => {
    try {
      await dispatch(deleteOpportunity(opportunityId));
      notification.success({
          message: 'Price List Deleted',
          description: 'Price List has been deleted successfully',
      });
      dispatch(getOpportunities());
    } catch (error) {
        console.error('Deletion failed:', error);
        notification.error({
            message: 'Deletion Failed',
            description: error.message || 'Failed to delete Price List. Please try again.',
        });
    }
  };

  const ops = []
  opportunities.map(opp => {
    ops.push({
      ...opp,
      account: accounts.find(a => a.sys_id === opp.account )
    })
  })

  console.log(ops[1].account.name);

  const columns = [
    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: 'Short Description',
      dataIndex: 'short_description',
      key: 'short_description',
    },
    {
      title: 'Account',
      dataIndex: 'account',
      key: 'account.sys_id',
      render: (account) => account?.name || 'N/A',
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage) => stage?.name || 'N/A',
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob) => `${prob}%`,
    },
    {
      title: 'Estimated Close',
      dataIndex: 'estimated_closed_date',
      key: 'estimated_closed_date',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => ( record!==undefined &&
        <div className="flex space-x-2">
          {/* <Popconfirm
            title="Change Status"
            description={`Are you sure you want to ${record.state === 'published' ? 'retire' : 'publish'} this opportunity?`}
            onConfirm={() => handleUpdateStatus(
              record.sys_id, 
              record.state === 'published' ? 'retired' : 'published'
            )}
          >
            <Button type="text" icon={<i className="ri-loop-right-line" />} />
          </Popconfirm>
          
          <Button 
            type="text" 
            icon={<i className="ri-pencil-line" />}
            onClick={() => {
              // You would implement edit functionality here
              message.info('Edit functionality to be implemented');
            }}
          /> */}
          
          <Popconfirm
            title="Delete Opportunity"
            description="Are you sure to delete this opportunity?"
            onConfirm={() => handleDelete(record._id)}
          >
            <button className="mx-2 text-gray-500 hover:text-red-600">
                <i className="ri-delete-bin-6-line text-2xl"></i>
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
  if (error) {
    console.log(error)
      notification.error({
              message: 'creation Failed',
              description: error.message || 'Failed to create opportunity. Please try again.',
          });
  }

  return (
    <div className="space-y-4">
      
      <Table
        headerColor="rgba(0, 117, 149, 1)"
        columns={columns}
        dataSource={ops}
        rowKey="sys_id"
        locale={{
          emptyText: <Empty description="No opportunities found" />,
        }}
        pagination={{
          pageSize: 6,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}

export default OpportunityTable;