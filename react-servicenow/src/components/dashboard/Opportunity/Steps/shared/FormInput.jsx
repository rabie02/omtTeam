

const FormInput = ({ formik, name, label, type = 'text', ...props }) => {
  const value = name.split('.').reduce((o, i) => o?.[i], formik.values);
  const touched = name.split('.').reduce((o, i) => o?.[i], formik.touched);
  const error = name.split('.').reduce((o, i) => o?.[i], formik.errors);

  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className="w-full border rounded px-3 py-2"
        {...props}
      />
      {touched && error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};



export default FormInput;