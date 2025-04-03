// const File = require("../models/File");
const Property = require('../models/Property');
const File = require('../models/File');
const Investment = require('../models/Investment');
const User = require('../models/users');
const crypto = require('crypto');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { sendNotification } = require('../app');
const { formatCurrency } = require('../helpers/format');

exports.createProperty = async (req, res) => {
  try {
    const { productName, amount, location, description } = req.body;
    const userId = res.locals.user.id;

    let pictureUrls = [];
    let videoUrls = [];

    if (req.files?.pictures) {
      for (const file of req.files.pictures) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "properties" });
        pictureUrls.push(result.secure_url);
      }
    }

    if (req.files?.videos) {
      for (const file of req.files.videos) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "properties", resource_type: "video" });
        videoUrls.push(result.secure_url);
      }
    }

    console.log('videoUrls:', videoUrls,'pictureUrls:', pictureUrls);

    const newProperty = new Property({
      productName,
      amount,
      location,
      description,
      pictures: pictureUrls,
      videos: videoUrls,
      seller: userId,
      buyer: null,
    });

    await newProperty.save();
  const users = await User.find({ role: "user" });

    users.forEach((user) => {
      const notificationData = {
        recipient: user._id,
        sender: userId,
        type: "new-purchase",
        title:'New Property Uploaded!',
        message: `A new property ${productName} has been uploaded`
      };
      sendNotification(user._id, notificationData);
    });

    res.status(201).json({ success: true, property: newProperty });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


exports.buyProperty = async (req, res) => {
  try {
      const { propertyId, amount } = req.body;
      const userId = res.locals.user.id;
      console.log('userId: ' + userId);
      

      if (!userId || !propertyId || !amount) {
          return res.status(400).json({ message: "All fields are required" });
      }

      const property = await Property.findById(propertyId);
      if (!property) {
          return res.status(404).json({ message: "Property not found" });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

    
      property.sold = true;
      property.buyer = userId;

      await property.save();
         const notificationData = {
              recipient: property.seller._id,
              sender: userId,
              type: "new-purchase",
              title:'One user bought a property!',
              message: `bought ${property.productName} at ${formatCurrency('NGN',amount)}`,
            };
              sendNotification(property.seller._id, notificationData);
      res.status(200).json({ message: "Property purchased successfully", property });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
};

exports.getProperties = async (req, res) => {
  try {
      const investments = await Property.find().populate("seller", "firstName lastName email").populate("buyer", "firstName lastName email");;
      res.status(200).json(investments);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    // const propertyId = mongoose.Types.ObjectId(req.params.id);
    const propertyId = req.params.id;
    console.log('propertyId:', propertyId);
      const property = await Property.findById(propertyId)
          .populate("seller", "firstName lastName email")
          .populate("buyer", "firstName lastName email");
      if (!property) {
          return res.status(404).json({ message: "Property not found" });
      }
      res.status(200).json(property);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
};

exports.getPropertiesBySeller = async (req, res) => {
    try {
      const userId = res.locals.user.id; // Get the logged-in user's ID
      console.log("userId:", userId);
  
      // Validate and convert userId to ObjectId if necessary
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
      }
  
      const properties = await Property.find({ seller: new mongoose.Types.ObjectId(userId) })
        .populate("seller", "firstName lastName email")
  
      res.status(200).json({ success: true, properties });
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ success: false, message: "Server error", error });
    }
  };
  
  exports.getPropertiesByBuyer = async (req, res) => {
    try {
      const userId = res.locals.user.id; // Get the logged-in user's ID
      const properties = await Property.find({ "buyer": userId })
        .populate("seller", "firstName lastName email")
        .populate("buyer", "firstName lastName email");
  
      res.status(200).json(properties);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error", error });
    }
  };

//     (async () => {
//     try {
//         // await Property.deleteMany({});
//       const investments = await Property.find();
//       console.log("All Investments:", investments);
//     } catch (error) {
//       console.error("Error fetching investments:", error.message);
//     }
//   })();
  

