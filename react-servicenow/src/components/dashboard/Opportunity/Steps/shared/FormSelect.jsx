const getNestedValue = (obj, path) => {
  return path.split('.').reduce((o, i) => o?.[i], obj);
};

const FormSelect = ({
  formik,
  name,
  label,
  onChange,
  onBlur,
  options,
  className = '',
  noLabel = false,
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


  
  return (
    <div className={`mb-4 ${className}`}>
      {!noLabel && label && <label className="block font-medium mb-1">{label}</label>}
      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full border rounded px-3 py-2.5 ${error ? 'border-red-500' : 'border-gray-300'} disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500`}
        {...props}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {touched && error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};


export default FormSelect;