const  express = require('express');
const authenticate = require('../middlewares/authenticate.js');
const { buyProperty, createProperty, getProperties, getPropertiesByBuyer, getPropertiesBySeller, getPropertyById } = require('../controllers/propertyController.js');
const upload = require('../helpers/upload.js');

const router = express.Router();
router.get("/", getProperties);
router.post("/create", upload.fields([{ name: "pictures", maxCount: 5 }, { name: "videos", maxCount: 3 }]),authenticate, createProperty);
router.post("/buy-property",authenticate, buyProperty);
router.get("/seller", authenticate, getPropertiesBySeller);
router.get("/buyer", authenticate, getPropertiesByBuyer);
router.get("/:id",authenticate, getPropertyById);

module.exports = router;