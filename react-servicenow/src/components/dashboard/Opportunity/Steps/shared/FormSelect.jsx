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
  const touched = getNestedValue(formik.touched, name);
  const error = getNestedValue(formik.errors, name);

  return (
    <div className={`mb-4 ${className}`}>
      {!noLabel && label && <label className="block font-medium mb-1">{label}</label>}
      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'}`}
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