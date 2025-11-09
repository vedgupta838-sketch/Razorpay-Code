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

// ✅ Create payment link
app.post("/create-order", async (req, res) => {
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: 1000, // in paise (10 INR)
      currency: "INR",
      description: "Vending Machine Purchase",
      customer: {
        name: "Customer",
        email: "customer@example.com",
      },
      notify: {
        sms: true,
        email: false,
      },
      reminder_enable: true,
    });

    // Send back link details
    res.json({
      id: paymentLink.id,         // example: "plink_123ABC"
      short_url: paymentLink.short_url, // QR link
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating payment link");
  }
});

// ✅ Check payment status
app.get("/check-payment", async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    // Fetch payment link details
    const response = await axios.get(
      `https://${process.env.RAZORPAY_KEY}:${process.env.RAZORPAY_SECRET}@api.razorpay.com/v1/payment_links/${order_id}`
    );

    console.log("Payment Link Status:", response.data.status);

    if (response.data.status === "paid") {
      return res.send("success");
    } else {
      return res.send("pending");
    }
  } catch (error) {
    console.error("Error checking payment:", error.response?.data || error);
    res.status(500).json({ error: "Failed to check payment" });
  }
});

// ✅ Test endpoint
app.get("/", (req, res) => {
  res.send("ESP32 Razorpay Backend Running ✅");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
