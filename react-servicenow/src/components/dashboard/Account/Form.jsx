import React from 'react';
import { Modal } from 'antd';

function AccountInfoForm({ open, setOpen, initialData = {} }) {
  const handleCancel = () => setOpen(false);

  return (
    <Modal
      title="Account Details"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      style={{ top: 20 }}
      width={900}
    >
      <form className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Name</label>
          <input
            value={initialData?.name || 'N/A'}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            value={initialData?.email || 'N/A'}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block font-medium mb-1">Phone</label>
          <input
            value={initialData?.phone || 'N/A'}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
      

        {/* Website */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Active</label>
          <input
            value={initialData?.status || 'N/A'}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        {/* Created Info */}
        <div>
          <label className="block font-medium mb-1">Created On</label>
          <input
            value={initialData?.createdAt ? new Date(initialData.createdAt).toLocaleString() : 'N/A'}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Updated At</label>
          <input
            value={initialData?.updatedAt ? new Date(initialData.updatedAt).toLocaleString() : 'N/A'}
            disabled
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>

        {/* Close Button */}
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

export default AccountInfoForm;