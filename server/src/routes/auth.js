const express = require('express');
const customerRouter = require('./customer');

const router = express.Router();

router.post('/wechat-login', customerRouter.handleWechatLogin);

module.exports = router;
