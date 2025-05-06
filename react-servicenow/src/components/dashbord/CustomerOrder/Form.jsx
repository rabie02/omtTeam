import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Modal } from 'antd';
import { create } from '../../../features/servicenow/customer-order/customerOrderSlice';


const validationSchema = Yup.object().shape({
  customer: Yup.string().required('Name is required'),
  productOffering: Yup.string().required('Name is required'),
});

function ProductOfferingCatalogForm({ open, setOpen, initialData = null, dispatch, options=null }) {
  const isEditMode = Boolean(initialData);

  const formik = useFormik({
    initialValues: {
      customer: initialData?.customer || '',
      productOffering: initialData?.productOffering || '',
    },
    validationSchema,
    onSubmit: async (values, {resetForm}) => {
      try {
        
        const product = options.productOfferings.find( po => po.id === values.productOffering)
        const account = options.accounts.find( acc => acc.sys_id === values.customer);
        
        const payload = {
            "pont": "false",
            "orderCurrency": initialData?.orderCurrency || product.productOfferingPrice[0].price.taxIncludedAmount.unit,
            "priority": initialData?.priority || 2,
            "orderDate": initialData?.orderDate || new Date().toISOString(),
            "channel": [
              {
                "id": "58ad5522c3702010df4773ce3640ddb2",
                "name": "Agent assist"
              }
            ],
            "productOrderItem": [
              {
                "id": initialData?.ProductOrderItem[0]?.id || Math.random().toString(36).substring(2, 10),
                "ponr": "false",
                "quantity": 1,
                "priority": initialData?.ProductOrderItem[0]?.priority || 2,
                "action": "add",
                "itemPrice": [
                  {
                    "priceType": "recurring",
                    "recurringChargePeriod": "month",
                    "price": {
                      "taxIncludedAmount": {
                        "unit": initialData?.ProductOrderItem[0]?.itemPrice[0]?.price.unit || product.productOfferingPrice[0].price.taxIncludedAmount.unit,
                        "value": initialData?.ProductOrderItem[0]?.itemPrice[0]?.price.value || product.productOfferingPrice[0].price.taxIncludedAmount.value
                      }
                    }
                  },
                  {
                    "priceType": "nonRecurring",
                    "price": {
                      "taxIncludedAmount": {
                        "unit": initialData?.ProductOrderItem[0]?.itemPrice[1]?.price.unit || product.productOfferingPrice[1].price.taxIncludedAmount.unit,
                        "value": initialData?.ProductOrderItem[0]?.itemPrice[1]?.price.value || product.productOfferingPrice[1].price.taxIncludedAmount.value
                      }
                    }
                  }
                ],
                "product": {
                  "@type": "Product",
                  "productCharacteristic": initialData?.ProductOrderItem[0]?.product.productCharacteristic || 
                  product.prodSpecCharValueUse.map( char => {
                    return {
                        "name": char.name,
                        "valueType": char.valueType,
                        "value": char.productSpecCharacteristicValue?.value || "",
                        "previousValue": ""
                    }
                  })
                  ,
                  "productSpecification": initialData?.ProductOrderItem[0]?.product.productSpecification || product.productSpecification
                },
                "productOffering": initialData?.ProductOrderItem[0]?.productOffering || {
                  "id": product.id,
                  "name": product.name,
                  "version": product.version,
                  "internalVersion": product.version,
                  "internalId": product.id
                },
                "state": "draft",
                "version": "1",
                "@type": "ProductOrderItem"
              }
            ],
            "relatedParty": initialData?.relatedParty ||  [
              {
                "id": account.sys_id,
                "name": account.name,
                "@type": "RelatedParty",
                "@referredType": "Customer"
              }
            ],
            "state": "draft",
            "version": "1",
            "@type": "ProductOrder"
          }
          
        
        await dispatch(create(payload)).unwrap();
        setOpen(false);
        resetForm();
      } catch (error) {
        console.error('Submission error:', error);
      }
    },
    enableReinitialize: true,
  });

  

  const handleCancel = () => setOpen(false);

  return (
    <Modal
      title={isEditMode ? 'Edit Order' : 'Add New Order'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        {/* Customer */}
        <div>
            <label className="block font-medium mb-1">Customer's Account:</label>
            <select
            id="customer"
            name="customer"
            value={formik.values.customer}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
            >
            <option value="">Select an account</option>
            {/* Map over the specs passed via props */}
            {options.accounts.map(account => (
                    <option key={account.id || account.sys_id} value={account.id || account.sys_id}> {/* Use correct ID field */}
                        {account.name} {/* Use correct Name field */}
                    </option> 
                    ))}
            </select>
            {/* Add validation message display */}
            {formik.touched.customer && formik.errors.customer && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.customer}</p>
            )}
        </div>

        {/* Product Offering */}
        <div>
            <label className="block font-medium mb-1">Product Offering:</label>
            <select
            id="productOffering"
            name="productOffering"
            value={formik.values.productOffering}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={formik.isSubmitting}
            className="w-full border rounded px-3 py-2"
            >
            <option value="">Select a product offering</option>
            {/* Map over the specs passed via props */}
            {options.productOfferings.map(po => (
                    <option key={po.id || po.sys_id} value={po.id || po.sys_id}> {/* Use correct ID field */}
                        {po.name || po.displayName} {/* Use correct Name field */}
                    </option> 
                    ))}
            </select>
            {/* Add validation message display */}
            {formik.touched.productOffering && formik.errors.productOffering && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.productOffering}</p>
            )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={formik.isSubmitting}
            className="px-4 py-2 rounded border bg-gray-200 text-red-400 hover:bg-red-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="px-4 py-2 rounded bg-cyan-700 text-white hover:bg-cyan-800"
          >
            {formik.isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
              ? 'Update Order'
              : 'Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductOfferingCatalogForm;
