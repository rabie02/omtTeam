import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popconfirm, Empty, Spin, Table, notification, Tooltip, Modal, Pagination} from 'antd';
import { 
  getOpportunities,
  deleteOpportunity,
  generateContract,
  downloadContract,
  resetError
} from '../../../features/servicenow/opportunity/opportunitySlice';
import CreateQuote from '../quote/ButtonCreateQuote';
import {getAll as getProductOfferingPrice} from '../../../features/servicenow/product-offering-price/productOfferingPriceSlice';



function OpportunityTable({ setData, setOpen, open, searchQuery }) {

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const showModal = (record) => setSelectedOpportunity(record);
  const hideModal = () => setSelectedOpportunity(null);

  const dispatch = useDispatch();
  const {
    opportunities,
    accounts,
    loading,
    partiallyLoading,
    error,
    currentPage,
    totalItems,
    limit,
    totalPages,
    productOfferingPrices
  } = useSelector((state) => state.opportunity);
  

  useEffect(() => {
    dispatch(resetError());
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
      dispatch(resetError());
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
    dispatch(resetError());
    setData(record);
    setOpen(true);
    
  };

  const handleGenerateContract = async (opportunityId) =>{
    try {
      dispatch(resetError());
      const res = await dispatch(generateContract(opportunityId));
      if(!res.error) notification.success({
          message: 'Contract Generated',
          description: 'Contract has been generated successfully',
      });
      //dispatch(getOpportunities({ page: 1, limit: 6, q: searchQuery }));
    } catch (error) {
        console.error('Generation failed:', error);
        notification.error({
            message: 'Generation Failed',
            description: error.message || 'Failed to generate Contract. Please try again.',
        });
    }
  }

  const handleDownloadContract = async (contractId) =>{
    try {
      dispatch(resetError());
      await dispatch(downloadContract(contractId));
      notification.success({
          message: 'Contract Downloaded',
          description: 'Contract has been downloaded successfully',
      });
      //dispatch(getOpportunities({ page: 1, limit: 6, q: searchQuery }));
    } catch (error) {
        console.error('Download failed:', error);
        notification.error({
            message: 'Download Failed',
            description: error.message || 'Failed to download Contract. Please try again.',
        });
    }
  }



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
        <div className="grid grid-cols-4 gap-2">
          <div>{ record.stage.type==="closed_won" &&<CreateQuote opportunityId={record._id} />}</div>
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
          <Tooltip title={"Update Opportunity Details"}>
            <button
                className="text-gray-500 hover:text-blue-600 disabled:text-gray-200"
                onClick={() => showPricingModal(record)}
            >
                <i className="ri-pencil-line text-2xl"></i>
            </button>
        </Tooltip>
        <Tooltip title={ (record.contract ? "Download":"Generate") +" Contract"}>
        {record.contract ? 
              <button 
                className=" text-gray-500 hover:text-orange-300"
                onClick={() => handleDownloadContract(record.contract._id)}
                disabled={partiallyLoading}
                >
                  <i className="ri-contract-fill text-2xl"></i>
              </button> : 
              <Popconfirm
                title={"Generate Contract"}
                description="Are you sure to Generate this opportunity's contract?"
                onConfirm={() => handleGenerateContract(record._id)}
              >
                <button className=" text-gray-500 hover:text-orange-300" disabled={partiallyLoading}>
                    <i className="ri-contract-line text-2xl"></i>
                </button>
              </Popconfirm>
              }
            
          </Tooltip>
        </div>
      ),
    },
  ];

  console.log(opportunities);


  if (!open && loading) return <div className='h-full flex justify-center items-center'><Spin /></div>;
  if (error) {
    console.log(error);
      notification.error({
              message: 'Error',
              description: error || 'Failed to create opportunity. Please try again.',
          });
          setTimeout(dispatch(resetError()), 1000)
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


      
    </div>
  );
}

export default OpportunityTable;