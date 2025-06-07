import React, { useState } from 'react';
import { Modal } from 'antd';

const OpportunityNavigation = ({
  currentStep,
  loading,
  prevStep,
  nextStep,
  handleCancel,
  formik, 
  downloadPDF,
  resetForm,
  editMode
}) => {

  const [isModalOpen, setIsModalOpen] = useState(false);


  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleCancel2 = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex justify-between pt-4">
      <div>
        {currentStep > 0 && (
          <button
            type="button"
            onClick={prevStep}
            className="px-4 py-2 rounded border bg-gray-200 hover:bg-gray-300"
          >
            Previous
          </button>
        )}
      </div>

      <div>
        { currentStep == 3 &&
        <button
            type="button"
            className="px-4 py-2 rounded border bg-red-200 hover:bg-gray-300"
            onClick={downloadPDF}
            
          >
            Download as PDF
          </button>
          }
      </div>
      
      <div className="flex space-x-2">
        {currentStep < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="px-4 py-2 rounded bg-cyan-700 text-white hover:bg-cyan-800"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
             onClick={formik.handleSubmit} // manual submit
            disabled={loading}
            className="px-4 py-2 rounded bg-cyan-700 text-white hover:bg-cyan-800"
          >
            {loading ? ( editMode ? 'Updating...' : 'Creating...') : ( editMode ? 'Update Opportunity':'Create Opportunity')}
          </button>
        )}
        
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded border bg-gray-200 text-red-400 hover:bg-red-400 hover:text-white"
        >
          Cancel
        </button>
        <div>
          <button
            type="button"
            onClick={showModal}
            className="px-4 py-2 rounded border bg-gray-200 text-red-400 hover:bg-red-400 hover:text-white"
            hidden={editMode}
          >
            Reset & Close
          </button>

          <Modal
            title="Confirm Reset"
            closable={{ 'aria-label': 'Custom Close Button' }}
            open={isModalOpen}
            onOk={handleOk}
            onCancel={handleCancel2}
            centered
          >
            <p>You sure you want to reset the form?</p>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default OpportunityNavigation;