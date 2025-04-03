// const File = require("../models/File");
const File = require('../models/File.js');
const Investment = require('../models/Investment.js');
const User = require('../models/users.js');
const crypto = require('crypto');
const fs = require('fs');
const  cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { sendNotification } = require('../app.js');
const { formatCurrency } = require('../helpers/format.js');

exports.createInvestment = async (req, res) => {
  try {
    const { productName, amountPerUnit, rate, period,description, totalShares } = req.body;
    const userId = res.locals.user.id;
    

    let pictureUrls = [];
    let videoUrls = [];

    if (req.files?.pictures) {
      for (const file of req.files.pictures) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "investments" });
        pictureUrls.push(result.secure_url);
      }
    }

    if (req.files?.videos) {
      for (const file of req.files.videos) {
        const result = await cloudinary.uploader.upload(file.path, { folder: "investments", resource_type: "video" });
        videoUrls.push(result.secure_url);
      }
    }


    const newInvestment = new Investment({
      productName,
      amountPerUnit,
      rate,
      period,
      description,
      totalShares,
      pictures: pictureUrls,
      videos: videoUrls,
      creator: userId,
    });

    await newInvestment.save();

    const users = await User.find({ role: "user" });

    users.forEach((user) => {
      const notificationData = {
        recipient: user._id,
        sender: userId,
        type: "new-investment",
        title:'New Investment Uploaded!',
        message: `A new investment ${productName} has been uploaded`
      };
      sendNotification(user._id, notificationData);
    });


    res.status(201).json({ success: true, investment: newInvestment });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};


exports.buyShares = async (req, res) => {
  try {
      const { investmentId, sharesToBuy } = req.body;
      const userId = res.locals.user.id;

      if (!userId || !investmentId || !sharesToBuy) {
          return res.status(400).json({ message: "All fields are required" });
      }

      const investment = await Investment.findById(investmentId);
      if (!investment) {
          return res.status(404).json({ message: "Investment not found" });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

            if (investment.sharesSold + sharesToBuy > investment.totalShares) {
        return res.status(400).json({ message: "Not enough shares available" });
      }

      const amountInvested = investment.amountPerUnit * sharesToBuy;

      investment.investors.push({
          user: userId,
          sharesBought: sharesToBuy,
          amountInvested,
      });

      investment.sharesSold += sharesToBuy;

      await investment.save();

      const notificationData = {
        recipient: investment.creator._id,
        sender: userId,
        type: "new-investment",
        title:'One user invested!',
        message: `invested in ${investment.productName}. Bought ${sharesToBuy} shares at ${formatCurrency('NGN',sharesToBuy*investment.amountPerUnit)}`,
      };
      console.log("notificationData:",notificationData);
      
      sendNotification(investment.creator._id, notificationData);

      res.status(200).json({ message: "Shares purchased successfully", investment });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
};

exports.getInvestments = async (req, res) => {
  try {
      const investments = await Investment.find().populate("creator", "firstName lastName email").populate("investors.user", "firstName lastName email");;
      res.status(200).json(investments);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
};

exports.getInvestmentById = async (req, res) => {
  try {
    // const investmentId = mongoose.Types.ObjectId(req.params.id);
    const investmentId = req.params.id;
    console.log('investmentId:', investmentId);
      const investment = await Investment.findById(investmentId)
          .populate("creator", "firstName lastName email")
          .populate("investors.user", "firstName lastName email");
      if (!investment) {
          return res.status(404).json({ message: "Investment not found" });
      }
     res.status(200).json(investment);
  } catch (error) {
      console.error(error);
       res.status(500).json({ message: "Server error" });
  }
};


// exports.buyShares = async (req, res) => {
//     try {
//       const { investmentId, sharesToBuy } = req.body;
//       const userId = res.locals.user.id; // Assume authentication middleware
  
//       const investment = await Investment.findById(investmentId);
//       if (!investment) return res.status(404).json({ message: "Investment not found" });
  
//       if (investment.sharesSold + sharesToBuy > investment.totalShares) {
//         return res.status(400).json({ message: "Not enough shares available" });
//       }
  
//       const amountInvested = sharesToBuy * investment.amountPerUnit;
  
//       // Create a share purchase record
//       const newSharePurchase = new InvestmentShare({
//         investor: userId,
//         investment: investmentId,
//         sharesBought: sharesToBuy,
//         amountInvested
//       });
  
//       await newSharePurchase.save();
  
//       // Update investment data
//       investment.sharesSold += sharesToBuy;
//       await investment.save();
  
//       // Update user profile
//       await User.findByIdAndUpdate(userId, { $push: { sharesOwned: newSharePurchase._id } });
  
//       res.status(200).json({ success: true, message: "Investment successful", investment, shares: newSharePurchase });
  
//     } catch (error) {
//       res.status(500).json({ success: false, message: "Server error", error });
//     }
//   };


exports.getInvestmentsByCreator = async (req, res) => {
    try {
      const userId = res.locals.user.id; // Get the logged-in user's ID
      console.log("userId:", userId);
  
      // Validate and convert userId to ObjectId if necessary
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
      }
  
      const investments = await Investment.find({ creator: new mongoose.Types.ObjectId(userId) })
        .populate("creator", "firstName lastName email")
  
      res.status(200).json({ success: true, investments });
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ success: false, message: "Server error", error });
    }
  };
  
  exports.getInvestmentsByBuyer = async (req, res) => {
    try {
      const userId = res.locals.user.id; // Get the logged-in user's ID
      const investments = await Investment.find({ "investors.user": userId })
        .populate("creator", "firstName lastName email")
        .populate("investors.user", "firstName lastName email");
  
      res.status(200).json(investments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error", error });
    }
  };

//     (async () => {
//     try {
//         // await Investment.deleteMany({});
//       const investments = await Investment.find();
//       console.log("All Investments:", investments);
//     } catch (error) {
//       console.error("Error fetching investments:", error.message);
//     }
//   })();
  

