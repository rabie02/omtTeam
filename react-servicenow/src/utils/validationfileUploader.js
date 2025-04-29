export const handleFileChange = (field, setFieldValue, setFieldError) => (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type (must be an image)
    if (!file.type.startsWith('image/')) {
      setFieldError(field, 'File must be an image');
      setFieldValue(field, null);
      event.target.value = '';
      return;
    }

    // Validate file size (4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > maxSize) {
      setFieldError(field, 'File must be smaller than 4MB');
      setFieldValue(field, null);
      event.target.value = '';
      return;
    }

  
  
      setFieldValue(field, file);
      setFieldError(field, undefined); // Clear previous errors
    
    reader.readAsDataURL(file);
  }
};
  