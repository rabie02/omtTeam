import { useDispatch, useSelector } from 'react-redux';
import { createQuote } from './quoteSlice';
import { notification } from 'antd'; 

const CreateQuoteButton = ({ opportunityId }) => {
  const dispatch = useDispatch();
  const { createLoading } = useSelector((state) => state.quotes);

  const handleCreate = async () => {
    try {
      await dispatch(createQuote(opportunityId)).unwrap();
      notification.success({
        message: 'Quote Created',
        description: 'The quote and its line items has been created successfully.',
      });
      // Optionally refetch quotes or update state here
    } catch (error) {
      notification.error({
        message: 'Creation Failed',
        description: error.message || 'Failed to create quote.',
      });
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={createLoading} className='group'>
        <i class="ri-file-edit-line text-2xl group-hover:text-green-600"></i>
      </button>
    </div>
  );
};

export default CreateQuoteButton;
