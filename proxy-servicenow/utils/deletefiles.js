const { log } = require('console');
const fs = require('fs');
const path = require('path');

deleteOldFiles = async ( oldImagePath, oldThumbnailPath) => {

  const deletePromises = [];

  // Delete old image if new image was uploaded
  if (oldImagePath) {
    const fullImagePath = path.join(process.cwd(), 'public/images/category/', oldImagePath);
    console.log(fullImagePath);  
    deletePromises.push(
      fs.promises.unlink(fullImagePath).catch(err => {
        console.error(`Failed to delete old image ${oldImagePath}:`, err);
      })
    );
  }

  // Delete old thumbnail if new thumbnail was uploaded
  if (oldThumbnailPath) {
    const fullThumbPath = path.join(process.cwd(), 'public', oldThumbnailPath);
    deletePromises.push(
      fs.promises.unlink(fullThumbPath).catch(err => {
        console.error(`Failed to delete old thumbnail ${oldThumbnailPath}:`, err);
      })
    );
  }

  await Promise.all(deletePromises);
};

module.exports = deleteOldFiles;