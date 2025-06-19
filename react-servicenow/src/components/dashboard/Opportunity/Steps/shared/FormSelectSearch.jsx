import { Select } from 'antd';

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((o, i) => o?.[i], obj);
};

const FormSelectSearch = ({
  formik,
  name,
  label,
  onChange,
  onBlur,
  options,
  className = '',
  noLabel = false,
  showSearch = true,
  filterOption = true,
  onSearch,
  placeholder,
  ...props
}) => {
  const value = getNestedValue(formik.values, name);
  let touched = getNestedValue(formik.touched, name);
  let error = getNestedValue(formik.errors, name);

  if (name.includes('[')) {
    // Handle array notation in field names (e.g., "products[0].price")
    const [basePath, ...nestedPaths] = name.split('.');
    const [arrayName, indexStr] = basePath.split(/[\[\]]/);
    const index = Number(indexStr);

    const arrayErrors = formik.errors[arrayName]?.[index];
    const arrayTouched = formik.touched[arrayName]?.[index];

    if (arrayErrors) {
      error = nestedPaths.reduce((obj, path) => obj?.[path], arrayErrors) ?? false;
    }

    if (arrayTouched) {
      touched = nestedPaths.reduce((obj, path) => obj?.[path], arrayTouched) ?? false;
    }
  }

  const handleChange = (value) => {
    formik.setFieldValue(name, value);
    onChange?.(value);
  };

  const handleBlur = () => {
    formik.setFieldTouched(name, true);
    onBlur?.();
  };

  return (
    <div className={`mb-4 ${className}`}>
      {!noLabel && label && <label className="block font-medium mb-1">{label}</label>}
      <Select
        showSearch={showSearch}
        placeholder={placeholder || `Select ${label}`}
        optionFilterProp="label"
        value={value || undefined}
        onChange={handleChange}
        onBlur={handleBlur}
        onSearch={onSearch}
        filterOption={filterOption === false ? false : (input, option) =>
          option.label.toLowerCase().includes(input.toLowerCase())
        }
        options={options}
        className={`w-full border ${touched && error ? 'border-red-500' : ''} ${props.disabled ? 'disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500' : ''}`}
        status={error && touched ? 'error' : ''}
        {...props}
      />
      {touched && error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormSelectSearch;