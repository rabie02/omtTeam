import React from 'react';
import { Modal } from 'antd';
import { formatDateForInput } from '@/utils/formatDateForInput';

function QuoteInfoForm({ open, setOpen, initialData = {} }) {
  const handleCancel = () => setOpen(false);

  return (
    <Modal
      title="Quote Information"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      style={{ top: 20 }}
    >
      <form className="grid grid-cols-2 gap-4">
        {/* Quote Number */}
        <div>
          <label className="block font-medium mb-1">Quote Number</label>
          <input
            value={initialData?.number || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* State */}
        <div>
          <label className="block font-medium mb-1">State</label>
          <input
            value={initialData?.state || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Short Description - spans both columns */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Short Description</label>
          <textarea
            value={initialData?.short_description || ''}
            rows="3"
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Total Amount */}
        <div>
          <label className="block font-medium mb-1">Total Amount</label>
          <input
            value={initialData?.total_amount ? `$${initialData.total_amount}` : ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Version */}
        <div>
          <label className="block font-medium mb-1">Version</label>
          <input
            value={initialData?.version || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Channel */}
        <div>
          <label className="block font-medium mb-1">Channel</label>
          <input
            value={initialData?.channel || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Active Status */}
        <div>
          <label className="block font-medium mb-1">Active Status</label>
          <input
            value={initialData?.active === "true" ? "Active" : "Inactive"}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Subscription Start Date */}
        <div>
          <label className="block font-medium mb-1">Subscription Start Date</label>
          <input
            type="date"
            value={formatDateForInput(initialData?.subscription_start_date) || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Subscription End Date */}
        <div>
          <label className="block font-medium mb-1">Subscription End Date</label>
          <input
            type="date"
            value={formatDateForInput(initialData?.subscription_end_date) || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Assigned To */}
        <div>
          <label className="block font-medium mb-1">Assigned To</label>
          <input
            value={initialData?.assigned_to || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Assignment Group */}
        <div>
          <label className="block font-medium mb-1">Assignment Group</label>
          <input
            value={initialData?.assignment_group || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Account - spans both columns */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Account</label>
          <input
            value={initialData?.account || ''}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Actions - spans both columns */}
        <div className="col-span-2 flex justify-end space-x-2 pt-2">
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

export default QuoteInfoForm;