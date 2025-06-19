import { useDispatch, useSelector } from 'react-redux';
import { createQuote } from '../../../features/servicenow/quote/quotaSlice';
import { notification, Tooltip, Popconfirm } from 'antd';

const CreateQuoteButton = ({ opportunityId, disabled }) => {
  const dispatch = useDispatch();
  const { createLoading } = useSelector((state) => state.quotes);

  const handleCreate = async () => {
    try {
      await dispatch(createQuote(opportunityId)).unwrap();
      notification.success({
        message: 'Quote Created',
        description: 'The quote and its line items have been created successfully.',
      });
    } catch (error) {
      notification.error({
        message: 'Creation Failed',
        description: error.message || 'Failed to create quote.',
      });
    }
  };

  return (
    <div>
      <Popconfirm
        title={`Create Quote`}
        description={`Are you sure you want to create this quote?`}
        onConfirm={handleCreate}
        okText="Yes"
        cancelText="No"
        disabled={createLoading || disabled}
      >
        <Tooltip title={disabled ? `Must win the opportunity!`:`Create Quote`}>
          <button disabled={createLoading || disabled} className='group'>
            <i className="ri-file-edit-line text-gray-500 text-2xl group-hover:text-green-600 group-disabled:text-gray-200"></i>
          </button>
        </Tooltip>
      </Popconfirm>
    </div>
  );
};

export default CreateQuoteButton;