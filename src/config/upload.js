require("dotenv").config();
const multer = require("multer");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "investments";
    let resource_type = file.mimetype.startsWith("video/") ? "video" : "image";
    const public_id = () => {
      // Generate a random string using crypto
      const randomString = crypto.randomBytes(16).toString("hex");

      // Get file extension
      const fileExtension = file.originalname.split(".").pop();

      // Combine random string with original extension
      return `${randomString}.${fileExtension}`;
    };
    console.log(file.mimetype.split("/")[1])
    console.log(resource_type)
    return {
      folder,
      format: file.mimetype.split(".")[1], // Keep original format
      resource_type,
      public_id: public_id(),
    };
  },
});

exports.upload = multer({ storage });



// const storage=multer.memoryStorage()
// const upload=multer({storage})

// module.exports={cloudinary,upload}



// require("dotenv").config();
// const multer = require("multer");
// const crypto = require("crypto");
// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // ✅ Cloudinary Storage Configuration
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     let folder = "investments";
//     let resource_type = file.mimetype.startsWith("video/") ? "video" : "image";

//     // Generate unique filename
//     const public_id = crypto.randomBytes(16).toString("hex");

//     return {
//       folder,
//       format: file.mimetype.split("/")[1], // Extract format from mimetype
//       resource_type,
//       public_id,
//     };
//   },
// });

// // ✅ Use `multer` with Cloudinary storage
// const upload = multer({ storage });

// module.exports = { cloudinary, upload };
