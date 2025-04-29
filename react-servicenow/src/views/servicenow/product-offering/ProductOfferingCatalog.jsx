import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getall,
  getOne,       // Keep if needed for detail view
  createCatalog,  // Keep if needed for creation
  updateCatalog,
  updateCatalogStatus,  // Keep if needed for updates
  deleteCatalog   // Keep if needed for deletion
} from '../../../features/servicenow/product-offering/productOfferingCatalogSlice'; // Adjust path
import Table from '../../../utils/table/Table';
import ProductOfferingCatalogForm from '../../../components/servicenow/product offering/ProductOfferingCatalogForm';


function ProductOfferingCatalog() {

  const dispatch = useDispatch();

  const {
    data: products,
    selectedProduct,
    loading,
    error,
  } = useSelector((state) => state.productOfferingCatalog);

  // --- State for the Add Catalog Form ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // Renamed for clarity
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false); // State for update modal
  const [recordToEdit, setRecordToEdit] = useState(null); // State to hold data for editing


  // Fetch all products on mount
  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      dispatch(getall());
    } else {
      console.error("Auth token not found. Please login.");
      // Handle missing token state
    }
  }, [dispatch]);

  // --- Modal Control ---
  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleOpenUpdateModal = (id) => {
        const record = products.find(p => (p.id || p.sys_id) === id); // Use the correct ID field
        if (record) {
            setRecordToEdit(record); // Store the record data
            setIsUpdateModalOpen(true); // Open the update modal
        } else {
            console.error("Could not find record with id:", id);
            alert("Could not find record to edit.");
        }
    };
    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setRecordToEdit(null); // Clear the record data
    };

  // --- Action Handlers ---
  const handleFetchOne = (id) => dispatch(getOne(id));
  const handleUpdate = (id, updatedData) => dispatch(updateCatalog({ id, ...updatedData }));

  const handleUpdateStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'draft' ? 'published' : 'retired';
    if (window.confirm(`Are you sure you want to ${newStatus} this catalog?`)) { // Fixed "category" to "catalog"
      dispatch(updateCatalogStatus({ id, status: newStatus })) // Corrected action name and payload
        .unwrap()
        .then(() => {
          alert(`Catalog ${newStatus}!`);
          dispatch(getall()); 
        })
        .catch((err) => {
          console.error("Status update failed:", err);
          alert(`Error: ${err?.message || 'Update failed'}`);
        });
    }
  };
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteCatalog(id));
    }
  };

  // --- Form Submission Handler (called by AddCatalogForm) ---
  const handleCreateSubmit = (catalogData) => {
    // Return the promise chain for potential further handling
    return dispatch(createCatalog(catalogData))
      .unwrap()
      .then(() => {
        alert('Catalog created successfully!');
        handleCloseCreateModal(); // Close modal on success
        // Optionally re-fetch all, though reducer should handle update
        // dispatch(getall());
      })
      .catch((err) => {
        console.error("Failed to create catalog:", err);
        // Error is in Redux state, but show specific feedback if needed
        alert(`Error creating catalog: ${err?.message || 'Unknown error'}`);
        // Optionally keep the modal open on error, or close it
        // handleCloseModal();
        // Re-throw the error if the caller needs to know about it
        // throw err;
      });
  };

  // Handler for submitting the UPDATE form
    const handleUpdateSubmit = (editedData) => {
        if (!recordToEdit) return; // Should not happen if modal is open correctly

        const idToUpdate = recordToEdit.id || recordToEdit.sys_id; // Get the ID

        return dispatch(updateCatalog({ id: idToUpdate, ...editedData })) // Dispatch update action
            .unwrap()
            .then(() => {
                alert('Catalog updated successfully!');
                handleCloseUpdateModal(); // Close the update modal
                 dispatch(getall()); // Re-fetch data to show updated list
            })
            .catch((err) => {
                console.error("Failed to update catalog:", err);
                alert(`Error updating catalog: ${err?.message || 'Unknown error'}`);
                // Optionally keep modal open on error?
            });
    };

  // --- Rendering Logic ---
  if (loading && products.length === 0 && !isCreateModalOpen && !isUpdateModalOpen) { // Don't show initial load if modal is somehow open
    return <div>Loading products...</div>; // Initial load indicator
  }

  // Basic Inline Styles for Modal (replace with library or better CSS)
  const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000 // Ensure it's on top
  };
  const modalContentStyle = {
    backgroundColor: '#fff', padding: '30px', borderRadius: '8px',
    maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
  };
   const buttonStyle = { padding: '10px 15px', marginRight: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' };
   const addButtonStyle = { ...buttonStyle, backgroundColor: '#007bff', color: 'white', marginBottom: '20px' };


  const colNames= ["Name", "Description", "Start Date", "End Date", "Action"];
  let t_head =[]; colNames.map((name)=>{
    t_head.push(<th className={ name==="Action"? "w-1/4 text-left py-3 px-4 uppercase font-semibold text-sm":"text-left py-3 px-4 uppercase font-semibold text-sm"}>{name}</th>)
  })
  const colBodyContent = [];
  // if(products.length > 0){
  //   products.map((product) => (colBodyContent.push({id:product.sys_id, status:product.status, content: [product.name, product.description, product.start_date, product.end_date]})))
  
  // }
  if(products.length > 0){
    products.map((product) => (colBodyContent.push(<tr key={product.sys_id} id={product.sys_id}>
      <td className="text-left py-3 px-4">{product.name}</td>
      <td className="text-left py-3 px-4">{product.description}</td>
      <td className="text-left py-3 px-4">{product.start_date}</td>
      <td className="text-left py-3 px-4">{product.end_date}</td>
      <td className="text-left py-3 px-4">
      <button className="bg-gray-500 px-4 py-2 mx-1 text-white cursor-pointer" onClick={()=> handleOpenUpdateModal(product.sys_id)}>Update</button>
      <button onClick={() => handleDelete(product.sys_id)} className="bg-red-400 mx-1 px-4 py-2 text-white cursor-pointer">Delete</button>
      </td>
    </tr>)))
  
  }
  return (
    <div style={{ padding: '20px' }}>
      <h1>Product Offering Catalog</h1>

      {/* Error Display (for general errors like fetching) */}
      {error && <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '15px' }}>Error: {error}</div>}

      {/* --- Button to Open Modal --- */}
      <button onClick={handleOpenCreateModal} style={addButtonStyle} disabled={loading}>
        Add New Catalog
      </button>

      {/* --- Product List Display --- */}
      <h2></h2>
       {/* Show subtle loading indicator near table during actions */}
       {loading && products.length > 0 && <div style={{marginBottom: '10px', fontStyle: 'italic', color: '#555'}}>Processing...</div>}
       
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
            </div>
            
            

          
        {/* <Table colNames={colNames} colBodyContent={colBodyContent} onDelete={handleDelete} onUpdateStatus={handleUpdateStatus} onUpdate={handleOpenUpdateModal} />  */}
        </div>
      ) : (
        !loading && <div style={{ marginTop: '20px', fontStyle: 'italic' }}>No catalogs found.</div>
      )}

    {/* --- Selected Product Details (Optional) --- */}
    {selectedProduct && !loading && (
         <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ddd', backgroundColor: '#eee' }}>
           <h2>Selected Product Details</h2>
           <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(selectedProduct, null, 2)}</pre>
         </div>
       )}


      {/* --- Modal for Adding Catalog --- */}
      {isCreateModalOpen && (
                <div style={modalOverlayStyle} onClick={handleCloseCreateModal}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <ProductOfferingCatalogForm
                            // key="add-form" // Optional: Force remount on open
                            onSubmit={handleCreateSubmit}
                            onCancel={handleCloseCreateModal}
                            isLoading={loading}
                            // initialData={null} // Explicitly null for clarity
                        />
                    </div>
                </div>
            )}

            {/* --- Modal for Updating Catalog --- */}
            {isUpdateModalOpen && recordToEdit && ( // Render only if open and record is selected
                <div style={modalOverlayStyle} onClick={handleCloseUpdateModal}>
                    <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                        <ProductOfferingCatalogForm
                            // Use a key to force re-render/reset when editing different items
                            key={recordToEdit.id || recordToEdit.sys_id}
                            onSubmit={handleUpdateSubmit}
                            onCancel={handleCloseUpdateModal}
                            isLoading={loading}
                            initialData={recordToEdit} // Pass the data to pre-fill the form
                        />
                    </div>
                </div>
            )}

    </div>
  );
}

export default ProductOfferingCatalog;