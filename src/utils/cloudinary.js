// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// cloudinary.config({
//   cloud_name: "process.env.CLOUDINARY_CLOUD_NAME",
//   api_key: "process.env.CLOUDINARY_API_KEY",
//   api_secret: "process.env.CLOUDINARY_API_SECRET",
// });

//  const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;
//     //upload the file on cloudinary
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });
//     //file has been ypload successfully
//     console.log(
//       "file has been successfully uploaded on cloudinary",
//       response.url
//     );
//     return response;
//   } catch (error) {
//     fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the upload operation got failed
//     return null;
//   }
// };

// export {uploadOnCloudinary}

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // File has been uploaded successfully
    // console.log(
    //   "File has been successfully uploaded on Cloudinary",
    //   response.url
    // );
    fs.unlinkSync(localFilePath); // Remove the locally saved temporary file if it exists

    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Remove the locally saved temporary file if it exists
    }
    return null;
  }
};

export { uploadOnCloudinary };
