import React, { useState, useEffect } from 'react';
import Table from '../../components/dashboard/ProductOffering/Table';
import Form from '../../components/dashboard/ProductOffering/Form';
import PageLayout from '../../layout/dashbord/PageLayout';
import { getPublished as getSpecs } from '../../features/servicenow/product-specification/productSpecificationSlice';
import { getall as getCats } from '../../features/servicenow/product-offering/productOfferingCategorySlice';
import { getall as getChannels } from '../../features/servicenow/channel/channelSlice';
import { useDispatch, useSelector } from 'react-redux';

function ProductOffering() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null); 
  const [searchQuery, setSearchQuery] = useState(null);
  const dispatch = useDispatch();
  
  // Selectors
  const { data: specs, loading: specsLoading, error: specsError } = useSelector(
    (state) => state.productSpecification
  );
  const { data: cats, loading: catsLoading, error: catsError } = useSelector(
    (state) => state.productOfferingCategory
  );
  const { data: channels, loading: channelsLoading, error: channelsError } =
    useSelector((state) => state.channel);

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      dispatch(getSpecs({ page: 1, limit: 99 }));
      dispatch(getCats({ page: 1, limit: 99 }));
      dispatch(getChannels());
    } else {
      console.error('Auth token not found. Please login.');
    }
  }, [dispatch]);

  const options = { specifications: specs, categories: cats, channels: channels };

  return (
    <PageLayout
      title="Product Offering"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      open={open}
      setOpen={setOpen}
      data={data}
      setData={setData}
      TableComponent={Table}
      FormComponent={Form}
      options={options}
      dispatch={dispatch}
    />
  );
}

export default ProductOffering;