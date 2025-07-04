

const FormInput = ({ formik, name, label, type = 'text', inputRef, autoFocus, ...props }) => {
  const value = name.split('.').reduce((o, i) => o?.[i], formik.values);
  let touched = name.split('.').reduce((o, i) => o?.[i], formik.touched);
  let error = name.split('.').reduce((o, i) => o?.[i], formik.errors);

  // if(name.includes('[')){
  //   //to deal with product offerings array error handling
  //   const q = name.split('.')
  //   const p = q[0].split('[') ;
  //   const n = p[1] ? p[1].split(']') : null;
  //   const index = Number(n[0]);
  //   const m = p[0] ? p[0] : null;
  //   const listOfErrors = formik.errors[""+m] !== undefined ? formik.errors[""+m] : false;
  //   const listOfTouched = formik.touched[""+m] !== undefined ? formik.touched[""+m] : null;
  //   if(q.length > 2 && listOfErrors){
  //     error = listOfErrors[index][q[1]] !== undefined && listOfErrors[index][q[1]][q[2]] !== undefined ? listOfErrors[index][q[1]][q[2]] : false;
  //     if(listOfTouched != null){
  //       touched = listOfTouched && listOfTouched[index][q[1]] !== undefined && listOfTouched[index][q[1]][q[2]] !== undefined ? listOfTouched[index][q[1]][q[2]] : false;
  //     }
  //   }else{
  //     error = listOfErrors[index][q[1]] !== undefined ? listOfErrors[index][q[1]] : false;
  //     if(listOfTouched != null) touched = listOfTouched && listOfTouched[index][q[1]] !== undefined ? listOfTouched[index][q[1]] : false;
  //   }
  // }

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

  // console.log(name);
  // console.log(error);
  // console.log(touched);

  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={`w-full border rounded px-3 py-2 ${touched && error ? 'border-red-500' : 'border-gray-300'} disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500`}
        ref={inputRef}
        autoFocus={autoFocus}
        onKeyDown={(e)=>{type === "date" ? e.preventDefault(): console.log()}}
        {...props}
        
      />
      {props.description && <p className="text-gray-400 text-sm">{props.description}</p>}
      {touched && error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};



export default FormInput;