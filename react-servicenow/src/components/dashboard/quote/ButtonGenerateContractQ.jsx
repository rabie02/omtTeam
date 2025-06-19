import { useDispatch, useSelector } from 'react-redux';
import { generateContract } from '../../../features/servicenow/contract-q/contractQSlice';
import { getContractModels } from '../../../features/servicenow/contract-model/contractModelSlice';
import { notification, Tooltip, Popconfirm } from 'antd';
import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal, Button, Select, Input, Tooltip, message } from 'antd';
import { LoadingOutlined, FileEditOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const CreateContractQButton = ({ quoteId, disabled }) => {
  const dispatch = useDispatch();
  const { generatedContract, error, loading } = useSelector((state) => state.contractQ);
  const { contractModels, error:modelError, loading:modelLoading } = useSelector((state) => state.contractModel);
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
    if (!disabled && !modelLoading && !loading) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    formik.resetForm();
  };


  return (
    <>
      <Tooltip title={'Create Contract'}>
        <Button
          type="text"
          disabled={(modelLoading && loading) || disabled}
          icon={<FileEditOutlined />}
          onClick={handleOpen}
          className="text-gray-500 hover:text-green-600 disabled:text-gray-200"
        />
      </Tooltip>

      <Modal
        title="Create New Contract"
        open={open}
        onCancel={handleClose}
        footer={[
          <Button key="back" onClick={handleClose}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={formik.isSubmitting}
            onClick={formik.handleSubmit}
          >
            Create
          </Button>
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
            <TextArea
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
    </>
  );
};

export default CreateContractQButton;