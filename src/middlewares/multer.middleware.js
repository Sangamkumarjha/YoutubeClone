import multer from "multer";

// Define multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Define the destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename for storing uploaded files
  },
});

// Create a multer upload instance with the defined storage configuration
export const upload = multer({ storage });
