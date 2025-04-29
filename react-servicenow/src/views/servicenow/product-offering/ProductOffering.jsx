import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getall,
  getOne,
  createProductOffering,
  updateProductOffering,
  updateProductOfferingStatus,  // Corrected action name
  deleteProductOffering
} from '../../../features/servicenow/product-offering/productOfferingSlice';
import { getall as getSpecs } from '../../../features/servicenow/product-specification/productSpecificationSlice';
import { getall as getCats } from '../../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getall as getChannels } from '../../../features/servicenow/channel/channelSlice';
import Table from '../../../utils/table/Table';
import ProductOfferingForm from '../../../components/servicenow/product offering/ProductOfferingForm';

function ProductOffering({po_type}) {
  const dispatch = useDispatch();

  // Selectors
  const { data: specs, loading: specsLoading, error: specsError } = useSelector(
    (state) => state.productSpecification
  );
  const { data: products, selectedProduct, loading, error } = useSelector(
    (state) => state.productOffering
  );
  const { data: cats, loading: catsLoading, error: catsError } = useSelector(
    (state) => state.productOfferingCategory
  );
  const { data: channels, loading: channelsLoading, error: channelsError } =
    useSelector((state) => state.channel);

   // --- Modal State ---
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // For creation
   const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false); // For update
   const [recordToEdit, setRecordToEdit] = useState(null); // Data for editing
  
  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      dispatch(getall());
      dispatch(getSpecs());
      dispatch(getCats());
      dispatch(getChannels());
    } else {
      console.error('Auth token not found. Please login.');
    }
  }, [dispatch]);

 

 // --- Modal Control Handlers ---
 const handleOpenCreateModal = () => setIsCreateModalOpen(true);
 const handleCloseCreateModal = () => setIsCreateModalOpen(false);

 const handleOpenUpdateModal = (id) => {
     // Find the product offering record by its ID
     const record = products.find(p => (p.id || p.sys_id) === id); // Use correct ID field if different
     if (record) {
         setRecordToEdit(record);
         setIsUpdateModalOpen(true);
     } else {
         console.error(`Could not find product offering with id: ${id} to edit.`);
         alert("Could not find record to edit.");
     }
 };

 const handleCloseUpdateModal = () => {
     setIsUpdateModalOpen(false);
     setRecordToEdit(null); // Clear editing state
 };


  const handleUpdateStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'draft' ? 'published' : 'retired';
    const databody = {"sys_id": id, "status": newStatus}

    if (window.confirm(`Are you sure you want to ${newStatus} this product offering?`)) {
      dispatch(updateProductOfferingStatus(databody))  // Fixed action name
        .unwrap()
        .then(() => {
          alert(`Product offering ${newStatus}!`);
          dispatch(getall());
        })
        .catch((err) => {
          console.error('Status update failed:', err);
          alert(`Error: ${err?.message || 'Update failed'}`);
        });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteProductOffering(id))
        .unwrap()
        .then(() => dispatch(getall()))
        .catch(console.error);
    }
  };

// --- Form Submission Handlers ---
const handleCreateSubmit = (productOfferingData) => {
  return dispatch(createProductOffering(productOfferingData))
      .unwrap()
      .then(() => {
          alert('Product Offering created successfully!');
          handleCloseCreateModal();
          dispatch(getall()); // Refresh list
      })
      .catch((err) => {
          alert(`Error creating product offering: ${err?.message || 'Unknown error'}`);
      });
};

// Handler for submitting the UPDATE form
const handleUpdateSubmit = (editedData) => {
  if (!recordToEdit) return; // Safety check

  const idToUpdate = recordToEdit.id || recordToEdit.sys_id; // Get ID

  // Dispatch the update action with ID and formatted data
  return dispatch(updateProductOffering({ id: idToUpdate, ...editedData }))
      .unwrap()
      .then(() => {
          alert('Product Offering updated successfully!');
          handleCloseUpdateModal(); // Close update modal
          dispatch(getall()); // Refresh list
      })
      .catch((err) => {
          console.error("Failed to update product offering:", err);
          alert(`Error updating product offering: ${err?.message || 'Unknown error'}`);
      });
};

  // Table configuration
  const colNames = ['Name', 'Product Specification', 'Start Date', 'End Date', 'Action'];
  
  let t_head =[]; colNames.map((name)=>{
    t_head.push(<th className={ name==="Action"? "w-1/4 text-left py-3 px-4 uppercase font-semibold text-sm":"text-left py-3 px-4 uppercase font-semibold text-sm"}>{name}</th>)
  })

  
  const colBodyContent =[];


  if(products.length > 0){
    products.map((product) => (product.status === po_type ? colBodyContent.push(<tr key={product.sys_id} id={product.sys_id}>
      <td className="text-left py-3 px-4">{product.name}</td>
      <td className="text-left py-3 px-4">{product.productSpecification?.name || 'N/A'}</td>
      <td className="text-left py-3 px-4">{product.validFor?.startDateTime}</td>
      <td className="text-left py-3 px-4">{product.validFor?.startDateTime}</td>
      <td className="text-left py-3 px-4">
        {product.status === "draft" ? <button  onClick={() => handleUpdateStatus(product.sys_id,product.status)}  className="bg-blue-500 px-4 py-2 mx-1 w-20 text-white cursor-pointer">Publish</button> : <button onClick={() => handleUpdateStatus(product.id,product.status)}  className="bg-yellow-400 px-4 py-2 mx-1 w-20 text-white cursor-pointer">Retire</button>}
      <button className="bg-gray-500 px-4 py-2 mx-1 w-20 text-white cursor-pointer" onClick={()=> handleOpenUpdateModal(product.id)}>Update</button>
      <button onClick={() => handleDelete(product.id)} className="bg-red-400 mx-1 px-4 py-2 w-20 text-white cursor-pointer">Delete</button>
      </td>
    </tr>):""))
  
  }

  // Loading and error states
  const initialLoading = loading || specsLoading || catsLoading || channelsLoading;
  
  if (initialLoading && products.length === 0 && !isCreateModalOpen && !isUpdateModalOpen) {
    return <div>Loading initial data...</div>;
  }

  // Styling
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
  };

  const addButtonStyle = {
    padding: '10px 15px',
    marginBottom: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Product Offerings</h1>

      {/* Error displays */}
      {error && <div className="error-message">{error}</div>}
      {catsError && <div className="error-message">{catsError}</div>}
      {specsError && <div className="error-message">{specsError}</div>}
      {channelsError && <div className="error-message">{channelsError}</div>}

      <button onClick={handleOpenCreateModal} style={addButtonStyle} disabled={initialLoading}>
        Add New Product Offering
      </button>

      {products.length > 0 ? (

<div className="md:px-32 py-8 w-full">
<div className="shadow overflow-hidden rounded border-b border-gray-200">
  <table className="min-w-full bg-white">
    <thead className="bg-cyan-700 text-white">
      <tr>
       {t_head}
      </tr>
    </thead>
    <tbody className="text-gray-700">
      {colBodyContent}
    </tbody>
    </table>
    </div></div>
        // <Table
        //   colNames={colNames}
        //   colBodyContent={colBodyContent}
        //   onDelete={handleDelete}
        //   onUpdateStatus={handleUpdateStatus}
        //   onStatusToggle={handleUpdateStatus}
        //   onUpdate={handleOpenUpdateModal}
        //   stateManage={true}
        // />
      ) : (
        !initialLoading && <div style={{ marginTop: '20px' }}>No product offerings found.</div>
      )}

      {/* --- Modal for Adding --- */}
      {isCreateModalOpen && (
                <div style={modalOverlayStyle} onClick={handleCloseCreateModal}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <ProductOfferingForm
                           // key="create-po" // Optional key
                            onSubmit={handleCreateSubmit}
                            onCancel={handleCloseCreateModal}
                            isLoading={loading} // Use PO loading state for submit
                            specs={specs}
                            cats={cats}
                            channels={channels}
                            specsLoading={specsLoading}
                            catsLoading={catsLoading}
                            channelsLoading={channelsLoading}
                            // initialData={null} // Default is null
                        />
                    </div>
                </div>
            )}

            {/* --- Modal for Updating --- */}
            {isUpdateModalOpen && recordToEdit && (
                 <div style={modalOverlayStyle} onClick={handleCloseUpdateModal}>
                     <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                         <ProductOfferingForm
                            // Force re-render/state reset when editing different items
                             key={recordToEdit.id || recordToEdit.sys_id}
                             onSubmit={handleUpdateSubmit} // Use the update handler
                             onCancel={handleCloseUpdateModal}
                             isLoading={loading} // Use PO loading state for submit
                             specs={specs}
                             cats={cats}
                             channels={channels}
                             specsLoading={specsLoading}
                             catsLoading={catsLoading}
                             channelsLoading={channelsLoading}
                             initialData={recordToEdit} // Pass data to pre-fill
                         />
                     </div>
                 </div>
             )}
    </div>
  );
}

export default ProductOffering;