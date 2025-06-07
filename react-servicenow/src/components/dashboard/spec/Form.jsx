import React from 'react';
import { Modal } from 'antd';
import {formatDateForInput} from '@/utils/formatDateForInput.js'

function ProductSpecificationForm({ open, setOpen, initialData = {} }) {
  const handleCancel = () => setOpen(false);

  return (
    <Modal
      title={'Product Specifications'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <form className="space-y-4">
        {/* Name */}
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input
            name="name"
            value={initialData?.display_name || (initialData?.displayName || '')}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block font-medium mb-1">Type</label>
          <input
            name="type"
            value={initialData?.specification_type || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="block font-medium mb-1">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formatDateForInput(initialData?.start_date) || formatDateForInput(initialData?.validFor.startDateTime)}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block font-medium mb-1">End Date</label>
          <input
            type="date"
            name="end_date"
            value={initialData?.end_date ? formatDateForInput(initialData?.end_date) : formatDateForInput(initialData?.validFor.endtDateTime)}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={initialData?.description || ''}
            rows="3"
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded border bg-gray-200 text-red-400 hover:bg-red-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductSpecificationForm;
