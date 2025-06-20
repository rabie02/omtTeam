import { useDispatch, useSelector } from 'react-redux';
import { generateContract } from '../../../features/servicenow/contract-q/contractQSlice';
import { getContractModels } from '../../../features/servicenow/contract-model/contractModelSlice';
import { notification, Tooltip, Modal, Select, Input } from 'antd';
import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import FormSelect from '../../shared/FormSelect';
import FormInput from '../../shared/FormInput';

const { Option } = Select;

const CreateContractQButton = ({ quoteId }) => {
  const dispatch = useDispatch();
  const { generatedContract, error, loading } = useSelector((state) => state.contractQ);
  const { contractModels, error: modelError, loading: modelLoading } = useSelector((state) => state.contractModel);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(getContractModels());
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      contract_model: '',
      description: '',
      name:''
    },
    validationSchema: Yup.object({
      contract_model: Yup.string().required('Contract model is required'),
      description: Yup.string(),
      name: Yup.string().required("a name is required")
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await dispatch(generateContract({quote:quoteId, ...values}));
        notification.success({
          message: 'Contract Created',
          description: 'The Contract and its line items have been created successfully.',
        });
        setSubmitting(false);
        setOpen(false);
      } catch (error) {
        notification.error({
          message: 'Creation Failed',
          description: error.message || 'Failed to create Contract.',
        });
        setSubmitting(false);
      }
    }
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    formik.resetForm();
  };

  const isEditMode = false;

  // const buttons = () => {
  //   return ();
  // };
  if(error){
    console.log(error);
  }

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
        footer={null}
        destroyOnHidden
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4 mt-4">
          <FormInput
                  formik={formik}
                  name="name"
                  label="Name*"
                />
          <FormSelect
            formik={formik}
            name="contract_model"
            label="Contract Model*"
            options={contractModels.map(model => ({
              value: model._id,
              label: model.name
            }))}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />

          <div>
            <label className="block font-medium mb-1">Description*</label>
            <textarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              status={formik.touched.description && formik.errors.description ? 'error' : ''}
              rows="3"
              className="w-full border rounded px-3 py-2"
            />
            {formik.touched.description && formik.errors.description ? (
              <div className="text-red-500 text-sm">{formik.errors.description}</div>
            ) : null}
          </div>
          <div className="flex justify-end space-x-2 pt-2 mt-4">
        <button
          type="button"
          onClick={handleClose}
          disabled={formik.isSubmitting}
          className="overflow-hidden relative w-28 h-10 bg-gray-200 text-red-400 border-none rounded-md text-lg font-bold cursor-pointer z-10 group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Cancel
          <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-200 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-500 duration-1000 origin-bottom"></span>
          <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-400 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-700 duration-700 origin-bottom"></span>
          <span className="absolute w-32 h-28 -top-7 -left-2 bg-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform group-hover:duration-1000 duration-500 origin-bottom"></span>
          <span className="group-hover:opacity-100 text-white group-hover:duration-1000 duration-100 opacity-0 absolute top-1.25 left-7.25 z-10">
            Cancel
          </span>
        </button>

        <button
          type="submit"
          disabled={formik.isSubmitting || !formik.isValid}
          className="overflow-hidden relative w-50 h-10 bg-cyan-700 text-white border-none rounded-md text-xl font-bold cursor-pointer z-10 group flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {formik.isSubmitting ? 'Please wait...' : 'Generate'}
          <span
            className={`absolute w-56 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${isEditMode
              ? 'bg-yellow-200 group-hover:duration-500 duration-1000'
              : 'bg-green-200 group-hover:duration-500 duration-1000'
              }`}
          ></span>
          <span
            className={`absolute w-56 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${isEditMode
              ? 'bg-yellow-400 group-hover:duration-700 duration-700'
              : 'bg-green-400 group-hover:duration-700 duration-700'
              }`}
          ></span>
          <span
            className={`absolute w-56 h-32 -top-8 -left-2 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-bottom ${isEditMode
              ? 'bg-yellow-600 group-hover:duration-1000 duration-500'
              : 'bg-green-600 group-hover:duration-1000 duration-500'
              }`}
          ></span>

          {!formik.isSubmitting && (
            <span className="group-hover:opacity-100 group-hover:duration-1000 duration-100 opacity-0 absolute text-center z-10">
              Contract
            </span>
          )}
        </button>
      </div>
        </form>
      </Modal>
    </div>
  );
};

export default CreateContractQButton;