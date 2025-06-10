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
        disabled={loading}
        className="overflow-hidden relative w-34 h-10 bg-gray-200 text-gray-700 border-none rounded-md text-lg font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        Previous
        {/* Gray bubble hover effect */}
        <span className="absolute w-38 h-32 -top-7 -left-2 bg-gray-300 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom"></span>
        <span className="absolute w-38 h-32 -top-7 -left-2 bg-gray-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom"></span>
        <span className="absolute w-38 h-32 -top-7 -left-2 bg-gray-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom"></span>
        <span className="group-hover:opacity-100 text-white group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-7.25 z-10">
          Previous
        </span>
      </button>
    )}
  </div>

  <div>
    {currentStep == 3 && (
      <button
        type="button"
        onClick={downloadPDF}
        className="overflow-hidden relative w-50 h-10 bg-red-200 text-red-600 border-none rounded-md text-lg font-bold cursor-pointer z-10 group flex items-center justify-center"
      >
        Download as PDF
        {/* Red bubble hover effect */}
        <span className="absolute w-58 h-28 -top-7 -left-2 bg-red-300 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom"></span>
        <span className="absolute w-58 h-28 -top-7 -left-2 bg-red-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom"></span>
        <span className="absolute w-58 h-28 -top-7 -left-2 bg-red-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom"></span>
        <span className="group-hover:opacity-100 text-white group-hover:duration-1000 duration-100 opacity-0 absolute text-center z-10">
          Download
        </span>
      </button>
    )}
  </div>
  
  <div className="flex space-x-2">
    {currentStep < 3 ? (
      <button
        type="button"
        onClick={nextStep}
        disabled={loading}
        className="overflow-hidden relative w-36 h-10 bg-cyan-700 text-white border-none rounded-md text-lg font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
        {/* Cyan bubble hover effect */}
        <span className="absolute w-40 h-32 -top-8 -left-2 bg-cyan-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom"></span>
        <span className="absolute w-40 h-32 -top-8 -left-2 bg-cyan-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom"></span>
        <span className="absolute w-40 h-32 -top-8 -left-2 bg-cyan-800 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom"></span>
        <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-7 z-10">
          Next Step
        </span>
      </button>
    ) : (
      <button
        type="submit"
        onClick={formik.handleSubmit}
        disabled={loading}
        className="overflow-hidden relative w-38 h-10 bg-cyan-700 text-white border-none rounded-md text-lg font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update' : 'Create')}
        
        {/* Conditional bubble colors */}
        <span className={`absolute w-40 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${editMode ? 'bg-yellow-200 group-hover:duration-500 duration-1000' : 'bg-green-200 group-hover:duration-500 duration-1000'}`}></span>
        <span className={`absolute w-40 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${editMode ? 'bg-yellow-400 group-hover:duration-700 duration-700' : 'bg-green-400 group-hover:duration-700 duration-700'}`}></span>
        <span className={`absolute w-40 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${editMode ? 'bg-yellow-600 group-hover:duration-1000 duration-500' : 'bg-green-600 group-hover:duration-1000 duration-500'}`}></span>

        {!loading && (
          <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-7 z-10">
            {editMode ? 'Update Now' : 'Create Now'}
          </span>
        )}
      </button>
    )}
    
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="overflow-hidden relative w-28 h-10 bg-gray-200 text-red-400 border-none rounded-md text-lg font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
      Cancel
      {/* Red bubble hover effect */}
      <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-200 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom"></span>
      <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom"></span>
      <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom"></span>
      <span className="group-hover:opacity-100 text-white group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-7.25 z-10">
        Cancel
      </span>
    </button>
    
    <div>
      <button
        type="button"
        onClick={showModal}
        disabled={loading}
        className="overflow-hidden relative w-32 h-10 bg-gray-200 text-red-400 border-none rounded-md text-lg font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        hidden={editMode}
      >
        Reset & Close
        {/* Red bubble hover effect */}
        <span className="absolute w-36 h-28 -top-7 -left-2 bg-red-200 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom"></span>
        <span className="absolute w-36 h-28 -top-7 -left-2 bg-red-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom"></span>
        <span className="absolute w-36 h-28 -top-7 -left-2 bg-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom"></span>
        <span className="group-hover:opacity-100 text-white group-hover:duration-1000 duration-100 opacity-0 absolute text-center z-10">
          Reset
        </span>
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