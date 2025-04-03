const  express = require('express');
const { createInvestment, getInvestments, getInvestmentById, buyShares, getInvestmentsByCreator, getInvestmentsByBuyer } = require('../controllers/investmentController.js');
// const { upload } = require('../helpers/upload.js');
const authenticate = require('../middlewares/authenticate.js');
const upload = require('../helpers/upload.js');

const router = express.Router();
router.get("/", getInvestments);
router.post("/create", upload.fields([{ name: "pictures", maxCount: 5 }, { name: "videos", maxCount: 3 }]),authenticate, createInvestment);
router.post("/buy-shares",authenticate, buyShares);
router.get("/creator", authenticate, getInvestmentsByCreator);
router.get("/buyer", authenticate, getInvestmentsByBuyer);
router.get("/:id",authenticate, getInvestmentById);

module.exports = router;