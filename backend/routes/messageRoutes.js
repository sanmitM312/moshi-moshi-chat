const express = require('express')
const router = express.Router()
const {sendMessage,allMessages} = require('../controllers/messageControllers')
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect,sendMessage)
router.route('/:chatId').get(protect,allMessages)

module.exports = router