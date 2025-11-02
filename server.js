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

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create order endpoint
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: 2000, // ₹20.00
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    console.log("Order Created:", order.id);
    res.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ✅ Check payment status endpoint
app.get("/check-payment", async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    // Fetch payment details for the order
    const response = await axios.get(
      `https://${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}@api.razorpay.com/v1/orders/${order_id}/payments`
    );

    const payments = response.data.items;
    console.log("Payments for order:", payments);

    if (payments.length > 0 && payments[0].status === "captured") {
      // Payment successful
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
