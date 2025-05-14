import React, { useState, useEffect } from 'react';
import { Modal, Select, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { updatecategoryStatus, createCatalogCategoryRelationship } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getall as getCatalogs } from '../../../features/servicenow/product-offering/productOfferingCatalogSlice';

function PublishButton({ categoryId, currentStatus, onSuccess }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const dispatch = useDispatch();
  
  // Get catalog data from Redux store
  const {
    data: catalogs,
    loading: loadingCatalogs
  } = useSelector((state) => state.productOfferingCatalog);
  
  // Load catalogs when modal opens
  useEffect(() => {
    if (modalVisible && currentStatus === 'draft') {
      dispatch(getCatalogs({ page: 1, limit: 100 }));
    }
  }, [modalVisible, currentStatus, dispatch]);
  
  // Determine appropriate button text based on current status
  const getButtonText = () => {
    switch(currentStatus) {
      case 'draft':
        return 'Publish';
      case 'published':
        return 'Retire';
      case 'retired':
        return 'Archive';
      case 'archived':
        return 'Restore';
      default:
        return 'Update Status';
    }
  };
  
  // Determine appropriate button color based on current status
  const getButtonColor = () => {
    switch(currentStatus) {
      case 'draft':
        return 'bg-green-600 hover:bg-green-700';
      case 'published':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'retired':
        return 'bg-gray-600 hover:bg-gray-700';
      case 'archived':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-cyan-700 hover:bg-cyan-800';
    }
  };
  
  // Determine if catalog selection is needed (only when publishing from draft)
  const needsCatalogSelection = currentStatus === 'draft';
  
  // Handle publish with catalog relationship
  const handlePublish = async () => {
    try {
      setSubmitting(true);
      
      // First, create catalog-category relationship if needed
      if (currentStatus === 'draft' && selectedCatalog) {
        try {
          // Use the Redux action to create relationship
          await dispatch(createCatalogCategoryRelationship({
            catalogId: selectedCatalog,
            categoryId: categoryId
          })).unwrap();
        } catch (relationshipError) {
          console.error('Failed to create relationship:', relationshipError);
          setSubmitting(false);
          return; // Don't proceed with status update if relationship creation fails
        }
      }
      
      // Then update the status
      await dispatch(updatecategoryStatus({ 
        id: categoryId, 
        currentStatus
      })).unwrap();
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal
      setModalVisible(false);
      setSelectedCatalog(null);
      setSubmitting(false);
    } catch (error) {
      console.error('Failed to update status:', error);
      setSubmitting(false);
    }
  };
  
  // Get appropriate modal title based on current status
  const getModalTitle = () => {
    switch(currentStatus) {
      case 'draft':
        return 'Publish Category';
      case 'published':
        return 'Retire Category';
      case 'retired':
        return 'Archive Category';
      case 'archived':
        return 'Restore Category';
      default:
        return 'Update Status';
    }
  };
  
  // Get appropriate modal message based on current status
  const getModalMessage = () => {
    switch(currentStatus) {
      case 'draft':
        return 'Are you sure you want to publish this category?';
      case 'published':
        return 'Are you sure you want to retire this category?';
      case 'retired':
        return 'Are you sure you want to archive this category?';
      case 'archived':
        return 'Are you sure you want to restore this category?';
      default:
        return 'Are you sure you want to update the status of this category?';
    }
  };
  
  // Get appropriate icon based on current status
  const getStatusIcon = () => {
    switch(currentStatus) {
      case 'draft':
        return <i className="ri-cloud-line text-xl text-green-500"></i>;
      case 'published':
        return <i className="ri-timer-line text-xl text-yellow-500"></i>;
      case 'retired':
        return <i className="ri-archive-line text-xl text-gray-500"></i>;
      case 'archived':
        return <i className="ri-refresh-line text-xl text-blue-500"></i>;
      default:
        return <i className="ri-error-warning-line text-xl text-yellow-500"></i>;
    }
  };
  
  return (
    <>
      <button
        className={`mr-2 px-4 py-2 rounded text-white flex items-center ${getButtonColor()}`}
        onClick={() => setModalVisible(true)}
      >
        {currentStatus === 'draft' && <i className="ri-cloud-line mr-1"></i>}
        {currentStatus === 'published' && <i className="ri-timer-line mr-1"></i>}
        {currentStatus === 'retired' && <i className="ri-archive-line mr-1"></i>}
        {currentStatus === 'archived' && <i className="ri-refresh-line mr-1"></i>}
        {getButtonText()}
      </button>
      
      {/* Modal for status change with catalog selection if needed */}
      <Modal
        title={
          <div className="flex items-center">
            <span className="mr-2">
              {getStatusIcon()}
            </span>
            <span>{getModalTitle()}</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCatalog(null);
        }}
        footer={[
          <button
            key="cancel"
            onClick={() => {
              setModalVisible(false);
              setSelectedCatalog(null);
            }}
            className="px-4 py-2 rounded border bg-gray-200 text-gray-700 hover:bg-gray-300"
            disabled={submitting}
          >
            Cancel
          </button>,
          <button
            key="ok"
            onClick={handlePublish}
            disabled={(needsCatalogSelection && !selectedCatalog) || submitting}
            className={`px-4 py-2 ml-2 rounded ${(needsCatalogSelection && !selectedCatalog) || submitting
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            {submitting ? (
              <span className="flex items-center">
                <Spin size="small" className="mr-2" /> Processing...
              </span>
            ) : (
              'Confirm'
            )}
          </button>
        ]}
      >
        <p>{getModalMessage()}</p>
        
        {/* Catalog selection - Only shown when publishing from draft */}
        {needsCatalogSelection && (
          <div className="mt-4">
            <label className="block font-medium mb-1">Select Catalog</label>
            <Select
              className="w-full"
              value={selectedCatalog}
              onChange={setSelectedCatalog}
              loading={loadingCatalogs}
              placeholder="Select a catalog"
              options={catalogs.map(catalog => ({
                value: catalog.sys_id,
                label: catalog.name
              }))}
            />
            <p className="text-sm text-gray-500 mt-1">
              A catalog-category relationship must be created before publishing.
            </p>
          </div>
        )}
        
        {/* Show loading message during actual publish */}
        {submitting && (
          <div className="mt-4 text-center text-gray-600">
            <Spin className="mr-2" /> Processing your request...
          </div>
        )}
      </Modal>
    </>
  );
}

export default PublishButton;