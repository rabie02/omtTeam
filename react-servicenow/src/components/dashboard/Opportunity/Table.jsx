import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Table, Tag, Button } from 'antd';
import { 
  getOpportunities,
  deleteOpportunity,
  updateOpportunityStatus
} from '../../../features/servicenow/opportunity/opportunitySlice';


function OpportunityTable({ setOpenForm }) {
  const dispatch = useDispatch();
  const {
    opportunities,
    loading,
    error
  } = useSelector((state) => state.opportunity);

  useEffect(() => {
    dispatch(getOpportunities());
  }, [dispatch]);
  
  const handleDelete = async (opportunityId) => {
    await dispatch(deleteOpportunity(opportunityId));
    dispatch(getOpportunities());
  };

  const handleUpdateStatus = async (opportunityId, newStatus) => {
    await dispatch(updateOpportunityStatus({
      id: opportunityId,
      status: newStatus
    }));
    dispatch(getOpportunities());
  };

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
      key: 'account',
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
          <Popconfirm
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
          />
          
          <Popconfirm
            title="Delete Opportunity"
            description="Are you sure to delete this opportunity?"
            onConfirm={() => handleDelete(record.sys_id)}
          >
            <Button type="text" danger icon={<i className="ri-delete-bin-6-line" />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="space-y-4">
      
      <Table
        headerColor="rgba(0, 117, 149, 1)"
        columns={columns}
        dataSource={opportunities}
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