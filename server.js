import express from "express";
import Razorpay from "razorpay";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🟢 Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ✅ Create payment link (for QR)
app.post("/create-order", async (req, res) => {
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: 1000, // in paise (₹10)
      currency: "INR",
      description: "Vending Machine Purchase",
      customer: {
        name: "Customer",
        email: "customer@example.com",
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: true,
    });

    // Send both link ID and short URL to ESP32
    res.json({
      id: paymentLink.id,                // e.g. plink_123ABC
      short_url: paymentLink.short_url,  // e.g. https://rzp.io/i/abcd123
    });
  } catch (err) {
    console.error("❌ Error creating payment link:", err);
    res.status(500).send("Error creating payment link");
  }
});

// ✅ Check payment link status
app.get("/check-payment", async (req, res) => {
  try {
    const { order_id } = req.query;  // ESP32 sends order_id
    if (!order_id) return res.status(400).send("failed");

    // Fetch Razorpay payment link details
    const response = await axios.get(
      `https://${process.env.RAZORPAY_KEY}:${process.env.RAZORPAY_SECRET}@api.razorpay.com/v1/payment_links/${order_id}`
    );

    const status = response.data.status;
    console.log(`🔍 Payment link ${order_id} status: ${status}`);

    if (status === "paid") {
      return res.send("success");
    } else {
      return res.send("failed");
    }
  } catch (error) {
    console.error("❌ Error checking payment:", error.response?.data || error.message);
    res.status(500).send("failed");
  }
});

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("ESP32 Razorpay Backend Running ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
