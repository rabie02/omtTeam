import React from 'react';
import { Button } from 'antd';

const OpportunityNavigation = ({
  currentStep,
  loading,
  prevStep,
  nextStep,
  handleCancel,
  formik
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
      
      <div className="flex space-x-2">
        {currentStep < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
             onClick={formik.handleSubmit} // manual submit
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            {loading ? 'Creating...' : 'Create Opportunity'}
          </button>
        )}
        
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 rounded border bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OpportunityNavigation;