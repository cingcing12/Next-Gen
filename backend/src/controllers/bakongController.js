import { BakongKHQR, MerchantInfo } from 'bakong-khqr';
import QRCode from 'qrcode';
import axios from 'axios';
import Order from '../models/Order.js';

const BAKONG_API_URL = 'https://api-bakong.nbc.gov.kh/v1';

// @desc    Generate Bakong KHQR using the official KHQR SDK (MerchantInfo)
// @route   POST /api/bakong/generate
// @access  Private
export const generateKHQR = async (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({ message: 'orderId and amount are required' });
  }

  const bakongAccount = process.env.BAKONG_ACCOUNT || 'sokpheak_vong@bkrt';
  console.log(`[Bakong KHQR] Generating QR for order ${orderId}, amount $${amount}, account ${bakongAccount}`);

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: `Order not found for id: ${orderId}` });
    }

    // Expiration: 5 minutes from now (in milliseconds)
    const expirationTimestamp = Date.now() + 5 * 60 * 1000;

    // Build MerchantInfo using the official bakong-khqr SDK
    const info = new MerchantInfo(
      bakongAccount,           // bakongAccountID e.g. "sokpheak_vong@bkrt"
      'Next-Gen Shop',         // merchantName
      'Phnom Penh',            // merchantCity
      'NEXTGEN001',            // merchantID
      'ABA Bank',              // acquiringBank
      {
        currency: 840,                    // 840 = USD, 116 = KHR
        amount: Number(amount),
        billNumber: orderId.toString(),   // track by order ID
        storeLabel: 'Next-Gen Fashion',
        expirationTimestamp,             // required for dynamic KHQR
      }
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateMerchant(info);

    if (!result || result.status?.code !== 0) {
      console.error('[Bakong KHQR] SDK Error:', result?.status);
      return res.status(500).json({ 
        message: result?.status?.message || 'Failed to generate KHQR', 
        error: result?.status 
      });
    }

    const { qr, md5 } = result.data;
    console.log(`[Bakong KHQR] Successfully generated KHQR with md5: ${md5}`);

    // Generate a real QR code image as base64 using the 'qrcode' package
    const qrImageBase64 = await QRCode.toDataURL(qr, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    });

    // Save md5 to the order for later payment verification
    order.md5 = md5;
    await order.save();

    res.json({
      qrString: qr,
      qrImage: qrImageBase64,   // base64 data URL — use directly as <img src="">
      md5,
      expireIn: 300,
    });
  } catch (error) {
    console.error('[Bakong KHQR] Generate Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate KHQR', error: error.message });
  }
};

// @desc    Check Bakong Transaction Status by MD5
// @route   POST /api/bakong/check
// @access  Private
export const checkTransaction = async (req, res) => {
  const { md5, orderId } = req.body;
  const bakongToken = process.env.BAKONG_TOKEN;

  try {
    const response = await axios.post(
      `${BAKONG_API_URL}/check_transaction_by_md5`,
      { md5 },
      {
        headers: {
          Authorization: `Bearer ${bakongToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // responseCode 0 = success/found
    if (response.data && response.data.responseCode === 0 && response.data.data) {
      const txn = response.data.data;
      const order = await Order.findById(orderId);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: txn.hash || md5,
          status: 'SUCCESS',
        };
        await order.save();
        return res.json({ success: true, message: 'Payment verified successfully' });
      } else {
        return res.status(404).json({ message: 'Order not found' });
      }
    } else {
      // Transaction not found yet — return 200 with success: false so frontend keeps polling
      return res.json({ success: false, message: 'Payment not confirmed yet' });
    }
  } catch (error) {
    console.error('Bakong Check Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
