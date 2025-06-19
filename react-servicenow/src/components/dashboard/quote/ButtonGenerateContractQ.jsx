import { useDispatch, useSelector } from 'react-redux';
import { generateContract } from '../../../features/servicenow/contract-q/contractQSlice';
import { getContractModels } from '../../../features/servicenow/contract-model/contractModelSlice';
import { notification, Tooltip, Modal, Select, Input } from 'antd';
import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const { Option } = Select;

const CreateContractQButton = ({ quoteId }) => {
  const dispatch = useDispatch();
  const { generatedContract, error, loading } = useSelector((state) => state.contractQ);
  //const { contractModels, error:modelError, loading:modelLoading } = useSelector((state) => state.contractModel);
  const contractModels = [{value:"test", label:"test"}]
  const [open, setOpen] = useState(false);

    useEffect(() => {
        dispatch(getContractModels());
    }, [dispatch]);


  const formik = useFormik({
    initialValues: {
      contractModel: '',
      description: ''
    },
    validationSchema: Yup.object({
      contractModel: Yup.string().required('Contract model is required'),
      description: Yup.string().required('Description is required')
    }),
    onSubmit: (values, { setSubmitting }) => {
        try {
          console.log(quoteId);
     // dispatch(generateContract(quoteId, values));
      notification.success({
        message: 'Contract Created',
        description: 'The Contract and its line items have been created successfully.',
      });
      } catch (error) {
      notification.error({
        message: 'Creation Failed',
        description: error.message || 'Failed to create Contract.',
      });
      }
      onSubmit(values).then(() => {
        setSubmitting(false);
        setOpen(false);
      });
    }
  });
  
  const handleOpen = () => {
      console.log(quoteId);    
      setOpen(true);
    
  };

  const handleClose = () => {
    setOpen(false);
    formik.resetForm();
  };


  return (
    <div>
      <Tooltip title={'Create Contract'}>
         <button className='group' onClick={handleOpen}>
            <i className="ri-quill-pen-line text-gray-500 text-2xl group-hover:text-green-600 group-disabled:text-gray-200"></i>
          </button>
      </Tooltip>

      <Modal
        title="Create New Contract"
        open={open}
        onCancel={handleClose}
        footer={[
          <button key="back" onClick={handleClose}>
            Cancel
          </button>,
          <button
            key="submit"
            type="primary"
            loading={formik.isSubmitting}
            onClick={formik.handleSubmit}
          >
            Create
          </button>
        ]}
      >
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Contract Model</label>
            <Select
              style={{ width: '100%' }}
              id="contractModel"
              name="contractModel"
              value={formik.values.contractModel}
              onChange={(value) => formik.setFieldValue('contractModel', value)}
              onBlur={formik.handleBlur}
              status={formik.touched.contractModel && formik.errors.contractModel ? 'error' : ''}
            >
              {contractModels.map((model) => (
                <Option key={model.value} value={model.value}>
                  {model.label}
                </Option>
              ))}
            </Select>
            {formik.touched.contractModel && formik.errors.contractModel && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.contractModel}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <Input
              id="description"
              name="description"
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              status={formik.touched.description && formik.errors.description ? 'error' : ''}
            />
            {formik.touched.description && formik.errors.description && (
              <div className="text-red-500 text-sm mt-1">
                {formik.errors.description}
              </div>
            )}
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default CreateContractQButton;