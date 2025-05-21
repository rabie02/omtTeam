import React from 'react';
import PropTypes from 'prop-types';

const FormRadioGroup = ({
  formik,
  name,
  label,
  options,
  direction = 'horizontal', // or 'vertical'
  className = '',
}) => {
  const value = formik.values[name];
  const touched = formik.touched[name];
  const error = formik.errors[name];

  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className="block font-medium mb-2">{label}</label>}
      
      <div className={`flex ${direction === 'horizontal' ? 'flex-row space-x-4' : 'flex-col space-y-2'}`}>
        {options.map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => formik.setFieldValue(name, option.value)}
              onBlur={formik.handleBlur}
              className="mr-2"
            />
            {option.label}
          </label>
        ))}
      </div>

      {touched && error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

FormRadioGroup.propTypes = {
  formik: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  className: PropTypes.string,
};

export default FormRadioGroup;