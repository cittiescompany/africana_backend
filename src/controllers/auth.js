const UserService = require('../services/users.js');
const {
  signjwt,
  registerVerification,
  loginVerification,
  generateOtp,
  isExpired,
} = require('../helpers/auth.js');
const sendEmail = require('../helpers/mail.js');
const User = require('../models/users.js');
const Notification = require('../models/Notification.js');
const users = require('../models/users.js');

const AuthController = {
  async signup(req, res, next) {
    try {
      const {
        isMerchant,
        merchantInfo = {},
        ...rest
      } = req.body;


      const {
        category,
        merchantName,
        address,
        country,
        state,
        description,
        businessImageUrl
      } = merchantInfo;
      // Check if user exists
      const existingUser = await UserService.getOne({ email:rest.email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      
      // Validate merchant fields if registering as merchant
      if (isMerchant) {
        if (!category || !merchantName || !address || !country || !state) {
          return res.status(400).json({
            success: false,
            message: 'For merchant registration, category, merchant name, address, country, and state are required'
          });
        }
      }
      
      const referralCode = Math.floor(1000 + Math.random() * 9000);
      const code = generateOtp();
      
      // Prepare user data
      const userData = {
        ...rest,
        referralCode,
        verificationOtp: {
          otp: code,
          expiresAt: Date.now() + 60 * 60 * 1000
        },
        isMerchant: isMerchant || false
      };
      
      // Add merchant info if applicable
      if (isMerchant) {
        userData.merchantInfo = {
          category,
          merchantName,
          address,
          country,
          state,
          description,
          businessImageUrl: businessImageUrl || ''
        };
      }
      const user = await UserService.create(userData);
      // Send verification email
      await sendEmail({
        to: user.email,
        subject: 'Welcome And account verification',
        html: registerVerification({
          code: user.verificationOtp.otp,
          user: `${user.firstName}`
        }),
      });

      // Create safe user object without sensitive data
      const safeUser = user.toObject();
      delete safeUser.password;
      delete safeUser.verificationOtp;
      delete safeUser.loginOtp;
      delete safeUser.googleId;

      res.status(201).json({
        success: true,
        user: safeUser,
        message: 'Successfully created an account'
      });
    } catch (err) {
      if (err.code === 11000) {
        let message;
        if (err.keyPattern.email) message = 'Email address already in use';
        else if (err.keyPattern.phone) message = 'Phone number already in use';
        else if (err.keyPattern['merchantInfo.merchantName']) {
          message = 'Merchant name already in use';
        }
        if (message) {
          return res.status(400).json({ success: false, message });
        }
      }
      next(err);
    }
  },
  async verification(req, res, next) {
    try {
      const { email, code, type } = req.body;
      const options =
        type === 'register'
          ? '+verificationOtp.otp +verificationOtp.expiresAt'
          : '+loginOtp.otp +loginOtp.expiresAt';
      const user = await UserService.getOne({ email }, options);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: 'Account does not exist.' });
      }

      const expiredAt =
        type === 'register'
          ? user.verificationOtp.expiresAt
          : user?.loginOtp?.expiresAt;
      if (type === 'register' && user?.verificationOtp?.otp !== code) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid verification code.' });
      }
      if (type === 'login' && user?.loginOtp?.otp !== code) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid login code.' });
      }
      if (isExpired(expiredAt)) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired.',
        });
      }
      if (type === 'register') {
        user.verificationOtp.otp = null;
        user.verification.email = true;
        user.isVerified = true;
      } else {
        user.verificationOtp.otp = null;
        user.loginOtp.otp = null;
        // user.isVerified = true;
      }
      await user.save();
      const token = await signjwt({ id: user.id });

      res.status(201).json({
        success: true,
        user: user,
        token,
        message:
          type == 'login'
            ? 'Account verified successfully'
            : 'Login successfully',
      });
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  },
  async resendMail(req, res, next) {
    try {
      const { email, type } = req.body;
      const code = generateOtp();
      const options =
        type === 'register'
          ? '+verificationOtp.otp +verificationOtp.expiresAt'
          : '+loginOtp.otp +loginOtp.expiresAt';
      const user = await UserService.getOne({ email }, options);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: 'Account does not exist.' });
      }
      if (type === 'register') {
        user.verificationOtp.otp = code;
        user.verificationOtp.expiresAt = Date.now() + 300 * 60 * 60 * 1000;
      } else {
        user.loginOtp.otp = code;
        user.loginOtp.expiresAt = Date.now() + 20 * 60 * 1000;
      }
      await user.save();
      const mailBody = {
        to: user.email,
        subject:
          type === 'register'
            ? 'Welcome And account verification'
            : 'Login verification',
        html:
          type === 'register'
            ? registerVerification({ code, user: `${user.firstName}` })
            : loginVerification({ code, user: `${user.firstName}` }),
      };
      await sendEmail(mailBody);

      res.status(201).json({
        success: true,
        message: 'Mail has been resent successfully',
      });
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  },
  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserService.getOne({ email }, '+password +isVerified');
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Account does not exist.',
        });
      }
      if (!user?.password) {
        return res.status(400).json({
          success: false,
          message: 'Username or password incorrect',
        });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Username or password incorrect',
        });
      }

      user.lastLogin = new Date();

      if (['admin', 'super admin'].includes(user.role)) {
        await user.save()
        const token = await signjwt({ id: user.id });
        const userObj = user.toObject();
delete userObj.password;
        return res.status(200).json({
          success: true,
          message: 'Login successfully',
          token,
          user: userObj,
        });
      }

      if (!user.isVerified) {
        return res
          .status(400)
          .json({ message: 'Please verify your account', success: false });
      }
      const code = generateOtp();
      user.loginOtp.otp = code;
      user.loginOtp.expiresAt = Date.now() + 20 * 60 * 1000;
      user.lastLogin = new Date();
      await user.save();
      await sendEmail({
        to: user.email,
        subject: 'Login verification',
        html: loginVerification({ code, user: `${user.firstName}` }),
      });
      user.password = undefined;
      res.status(200).json({ message: 'success login', success: true });
    } catch (err) {
      next(err);
    }
  },
  async getProfile(req, res, next) {
    try {
      const user = await UserService.getOne({ _id: res.locals.user.id });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: 'User not found' });
      res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },
  // async getUsers(req, res, next) {
  //   try {
  //     const users = await UserService.getAll();
  //     return res.status(200).json({
  //       success: true,
  //       users: users.length > 0 ? users : 'No registered users yet',
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // },

  async getUsers(req, res, next) {
    console.log(res.locals.user.id);
    try {
      const currentUserId = res.locals.user.id; // assuming user is authenticated and ID is set in req.user
  
      const users = await User.find({ _id: { $ne: currentUserId } }) // exclude current user
        .sort({ lastLogin: -1 })                                      // sort by earliest lastLogin
        .select('-password');                                        // exclude password field
  
      return res.status(200).json({
        success: true,
        users: users.length > 0 ? users : 'No registered users yet',
      });
    } catch (err) {
      next(err);
    }
  },
  async getMerchants(req, res) {
    const { country, category } = req.query;
    try {
      const query = {
        isMerchant: { $in: [true, "true"] }, // To handle both boolean and string values
      };
  
      if (country) {
        query['merchantInfo.country'] = country;
      }
  
      if (category && category.toLowerCase() !== 'all') {
        query['merchantInfo.category'] = category;
      }
  
      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .select('-password'); // Exclude password
  
      return res.status(200).json({
        success: true,
        message: users.length > 0 ? 'Merchants found' : 'No merchant yet',
        merchants:users,
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  

  async getUserNotifications(req, res) {
    try {
      const userId = res.locals.user.id;

      console.log('userId: ' + userId);

      const notifications = await Notification.find({ recipient: userId })
        .populate('sender', 'firstName lastName email')
        .populate('recipient', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, notifications });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  async markNotificationsAsRead(req, res) {
    try {
      const userId = res.locals.user.id;

      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true },
      );

      res
        .status(200)
        .json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async deleteNotification(req, res) {
    try {
      const notificationId = req.params.id;
      const userId = res.locals.user.id;

      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId,
      });

      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: 'Notification not found' });
      }

      await Notification.deleteOne({ _id: notificationId });

      res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
};

async function saveMerchants(merchantsArray) {
  try {
    // Insert many documents at once
    const result = await users.insertMany(merchantsArray);
    console.log(`${result.length} merchants saved successfully.`);
  } catch (error) {
    console.error('Error saving merchants:', error);
  }
}
async function getMerchants(merchantsArray) {
  try {
    // Insert many documents at once
    const result = await users.find({isMerchant: true});
    console.log(result);
  } catch (error) {
    console.error('Error saving merchants:', error);
  }
}
// getMerchants();

async function deleteMerchants(merchantsArray) {
  try {
    for (const merchant of merchantsArray) {
     const result = await users.deleteOne({ email: merchant.email });
     console.log(`${result.deletedCount} merchant(s) deleted successfully for email: ${merchant.email}`);
    }
  } catch (error) {
    console.error('Error saving merchants:', error);
  }
}

const merchants = [
  {
    email: "derin.adesanya@gmail.com",
    firstName: "Derin",
    lastName: "Adesanya",
    phone: "08012345678",
    password: "pass1234",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Savannah Grill",
      category: "Restaurant",
      country: "Nigeria",
      state: "Lagos",
      address: "123 Victoria Island",
      businessImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
      description: "Authentic Nigerian cuisine in a modern setting"
    }
  },
  {
    email: "temitope.oluwaseun@gmail.com",
    firstName: "Temitope",
    lastName: "Oluwaseun",
    phone: "07098765432",
    password: "securepass",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "AfroFood Market",
      category: "Food Items",
      country: "Nigeria",
      state: "Lagos",
      address: "45 Lekki Phase 1",
      businessImageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
      description: "Premium African food ingredients delivered to your door"
    }
  },
  {
    email: "oluwatobi.abiodun@gmail.com",
    firstName: "Oluwatobi",
    lastName: "Abiodun",
    phone: "09023456789",
    password: "tobi2025",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Nubian Threads",
      category: "African Attire",
      country: "Nigeria",
      state: "Abuja",
      address: "78 Central District",
      businessImageUrl: "https://images.unsplash.com/photo-1591561954555-607968c989ab?w=500",
      description: "Handcrafted African clothing and accessories"
    }
  },
  {
    email: "adesola.akintola@gmail.com",
    firstName: "Adesola",
    lastName: "Akintola",
    phone: "08134567890",
    password: "adesola123",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Herbal Haven",
      category: "Herb",
      country: "Nigeria",
      state: "Ogun",
      address: "22 Abeokuta Road",
      businessImageUrl: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=500",
      description: "Traditional African herbs and natural remedies"
    }
  },
  {
    email: "femi.olawale@gmail.com",
    firstName: "Femi",
    lastName: "Olawale",
    phone: "07034567891",
    password: "femi7890",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Curls & Coils",
      category: "Hair Saloon",
      country: "Nigeria",
      state: "Lagos",
      address: "56 Ikeja City Mall",
      businessImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500",
      description: "Specialists in African hair care and styling"
    }
  },
  {
    email: "ngozi.ekene@gmail.com",
    firstName: "Ngozi",
    lastName: "Ekene",
    phone: "09087654321",
    password: "ngozi456",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Taste of Kenya",
      category: "Restaurant",
      country: "Kenya",
      state: "Nairobi",
      address: "34 Kilimani Road",
      businessImageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500",
      description: "Experience the rich flavors of Kenyan cuisine"
    }
  },
  {
    email: "adesanya.oluwaseyi@gmail.com",
    firstName: "Oluwaseyi",
    lastName: "Adesanya",
    phone: "08056789123",
    password: "oluwa2024",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Spice Traders",
      category: "Food Items",
      country: "Ghana",
      state: "Accra",
      address: "89 Independence Ave",
      businessImageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500",
      description: "Premium African spices and cooking ingredients"
    }
  },
  {
    email: "bola.ndlovu@gmail.com",
    firstName: "Bola",
    lastName: "Ndlovu",
    phone: "07123456789",
    password: "bola1234",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Zulu Designs",
      category: "African Attire",
      country: "South Africa",
      state: "Johannesburg",
      address: "12 Soweto Plaza",
      businessImageUrl: "https://images.unsplash.com/photo-1591369822090-8d9a14fdd0c5?w=500",
      description: "Contemporary African fashion inspired by tradition"
    }
  },
  {
    email: "chinonso.okafor@gmail.com",
    firstName: "Chinonso",
    lastName: "Okafor",
    phone: "08187654321",
    password: "chinny2025",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Savannah Grill",
      category: "Restaurant",
      country: "Nigeria",
      state: "Lagos",
      address: "123 Victoria Island",
      businessImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
      description: "Authentic Nigerian cuisine in a modern setting"
    }
  },
  {
    email: "toyin.adeleke@gmail.com",
    firstName: "Toyin",
    lastName: "Adeleke",
    phone: "09034561234",
    password: "adeleke123",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "AfroFood Market",
      category: "Food Items",
      country: "Nigeria",
      state: "Lagos",
      address: "45 Lekki Phase 1",
      businessImageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
      description: "Premium African food ingredients delivered to your door"
    }
  },
  {
    email: "sola.adebayo@gmail.com",
    firstName: "Sola",
    lastName: "Adebayo",
    phone: "07012349876",
    password: "sola2024",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Herbal Haven",
      category: "Herb",
      country: "Nigeria",
      state: "Ogun",
      address: "22 Abeokuta Road",
      businessImageUrl: "https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=500",
      description: "Traditional African herbs and natural remedies"
    }
  },
  {
    email: "janet.kamau@gmail.com",
    firstName: "Janet",
    lastName: "Kamau",
    phone: "07123456780",
    password: "janet7890",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Taste of Kenya",
      category: "Restaurant",
      country: "Kenya",
      state: "Nairobi",
      address: "34 Kilimani Road",
      businessImageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500",
      description: "Experience the rich flavors of Kenyan cuisine"
    }
  },
  {
    email: "amos.nyarko@gmail.com",
    firstName: "Amos",
    lastName: "Nyarko",
    phone: "02456789012",
    password: "amos1234",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Spice Traders",
      category: "Food Items",
      country: "Ghana",
      state: "Accra",
      address: "89 Independence Ave",
      businessImageUrl: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500",
      description: "Premium African spices and cooking ingredients"
    }
  },
  {
    email: "thando.mbeki@gmail.com",
    firstName: "Thando",
    lastName: "Mbeki",
    phone: "07111222333",
    password: "thando2025",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Zulu Designs",
      category: "African Attire",
      country: "South Africa",
      state: "Johannesburg",
      address: "12 Soweto Plaza",
      businessImageUrl: "https://images.unsplash.com/photo-1591369822090-8d9a14fdd0c5?w=500",
      description: "Contemporary African fashion inspired by tradition"
    }
  },
  {
    email: "temi.adebanjo@gmail.com",
    firstName: "Temi",
    lastName: "Adebanjo",
    phone: "08033445566",
    password: "temi2025",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Sahara Spice",
      category: "Food Items",
      country: "Nigeria",
      state: "Kano",
      address: "9 Northern Market",
      businessImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500",
      description: "Exotic spices and herbs from the Sahara region"
    }
  },
  {
    email: "mariam.balogun@gmail.com",
    firstName: "Mariam",
    lastName: "Balogun",
    phone: "07055667788",
    password: "mariam123",
    role: "user",
    isMerchant: true,
    merchantInfo: {
      merchantName: "Lagos Leatherworks",
      category: "African Attire",
      country: "Nigeria",
      state: "Lagos",
      address: "100 Leather Street",
      businessImageUrl: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?w=500",
      description: "Handmade leather fashion and accessories"
    }
  }
];

// deleteMerchants(merchants);

// saveMerchants(merchants);

// (async () => {
//   try {
//       // await User.deleteMany({});
//     const users = await User.find();
//     console.log("All users:", users);
//   } catch (error) {
//     console.error("Error fetching users:", error.message);
//   }
// })();

module.exports = AuthController;
