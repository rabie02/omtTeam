import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Table, notification, Tooltip, Modal, Pagination} from 'antd';
import { 
  getOpportunities,
  deleteOpportunity,
  getProductOfferingPrice,
  updateOpportunityPricing
} from '../../../features/servicenow/opportunity/opportunitySlice';
import OpportunityStep4 from './Steps/DetailsModal';
import UpdatePricingModal from './Steps/UpdatePricingModal';


function OpportunityTable({ searchQuery }) {

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [currentOpportunity, setCurrentOpportunity] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const showModal = (record) => setSelectedOpportunity(record);
  const hideModal = () => setSelectedOpportunity(null);

  const dispatch = useDispatch();
  const {
    opportunities,
    accounts,
    loading,
    error,
    currentPage,
    totalItems,
    limit,
    totalPages,
    productOfferingPrices
  } = useSelector((state) => state.opportunity);
  

  useEffect(() => {
    dispatch(getOpportunities({ page: 1, limit: 6, q: searchQuery }));
    dispatch(getProductOfferingPrice());
  }, [dispatch, searchQuery]);


  // Helper function to extract value from ServiceNow object format
    const getValue = (field) => {
        if (!field) return '';
        return typeof field === 'object' ? field.value : field;
    };

  const handleDelete = async (opportunityId) => {
    try {
      await dispatch(deleteOpportunity(opportunityId));
      notification.success({
          message: 'Opportunuity Deleted',
          description: 'Opportunuity has been deleted successfully',
      });
      //dispatch(getOpportunities({ page: 1, limit: 6, q: searchQuery }));
    } catch (error) {
        console.error('Deletion failed:', error);
        notification.error({
            message: 'Deletion Failed',
            description: error.message || 'Failed to delete Opportunuity. Please try again.',
        });
    }
  };

  const handlePageChange = (page) => {
          dispatch(getOpportunities({ page, limit, q: searchQuery }));
      };

  const showPricingModal = (record) => {
    setCurrentOpportunity(record);
    setPricingModalVisible(true);
  };

  const handlePricingSubmit = async (payload) => {
    try {
      setUpdateLoading(true);
      await dispatch(updateOpportunityPricing(payload));
      notification.success({
        message: 'Pricing Updated',
        description: 'Pricing has been updated successfully',
      });
      setPricingModalVisible(false);
    } catch (error) {
      console.error('Pricing update failed:', error);
      notification.error({
        message: 'Update Failed',
        description: error.message || 'Failed to update pricing. Please try again.',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const columns = [
    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
      sorter: (a, b) => getValue(a.number).localeCompare(getValue(b.number)),
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
      render: (stage) => stage?.sys_name || 'N/A',
    },
    {
      title: 'Sales Cycle Type',
      dataIndex: 'sales_cycle_type',
      key: 'sales_cycle_type',
      render: (sales_cycle_type) => sales_cycle_type?.sys_name || 'N/A',
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
      sorter: (a, b) => getValue(a.estimated_closed_date).localeCompare(getValue(b.estimated_closed_date)),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => ( record!==undefined &&
        <div className="grid grid-cols-3 gap-2">
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
          <Tooltip title={`Delete Opportunity`}>
            <Popconfirm
              title="Delete Opportunity"
              description="Are you sure to delete this opportunity?"
              onConfirm={() => handleDelete(record._id)}
            >
              <button className=" text-gray-500 hover:text-red-600">
                  <i className="ri-delete-bin-6-line text-2xl"></i>
              </button>
            </Popconfirm>
          </Tooltip>
          
          <Tooltip title="See More Details">
            <button 
              className=" text-gray-500 hover:text-green-600"
              onClick={() => showModal(record)}
            >
              <i className="ri-eye-line text-2xl"></i>
            </button>
          </Tooltip>
          <Tooltip title={"Update Pricing"}>
            <button
                className="text-gray-500 hover:text-blue-600 disabled:text-gray-200"
                onClick={() => showPricingModal(record)}
            >
                <i className="ri-pencil-line text-2xl"></i>
            </button>
        </Tooltip>
        </div>
      ),
    },
  ];


  if (loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
  if (error) {
      notification.error({
        
              message: 'Error',
              description: error || 'Failed to create opportunity. Please try again.',
          });
  }

  return (
    <div className="">
      
      <Table
        headerColor="rgba(0, 117, 149, 1)"
        columns={columns}
        dataSource={opportunities}
        rowKey="_id"
        locale={{
          emptyText: <Empty description="No opportunities found" />,
        }}
        pagination={false}
      />
      <div className="mt-6 flex justify-end">
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

      <Modal
        open={!!selectedOpportunity}
        onCancel={hideModal}
        footer={null}
        width={800}
      >
        {selectedOpportunity && (
          <OpportunityStep4 
            initialData={selectedOpportunity}
          />
        )}
      </Modal>

      {currentOpportunity !== null && <UpdatePricingModal
        visible={pricingModalVisible}
        onCancel={() => setPricingModalVisible(false)}
        opportunity={currentOpportunity}
        productOfferings={productOfferingPrices}
        onSubmit={handlePricingSubmit}
        loading={updateLoading}
      />}
      
    </div>
  );
}

export default OpportunityTable;