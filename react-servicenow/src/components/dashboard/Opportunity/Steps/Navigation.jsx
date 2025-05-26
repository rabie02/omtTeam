import React from 'react';


const OpportunityNavigation = ({
  currentStep,
  loading,
  prevStep,
  nextStep,
  handleCancel,
  formik, 
  downloadPDF
}) => {
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
            {loading ? 'Creating...' : 'Create Opportunity'}
          </button>
        )}
        
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded border bg-gray-200 text-red-400 hover:bg-red-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OpportunityNavigation;