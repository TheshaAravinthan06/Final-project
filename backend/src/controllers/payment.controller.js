import mongoose from "mongoose";
import Stripe from "stripe";
import Payment from "../models/payment.models.js";
import Booking from "../models/booking.models.js";
import TravelPick from "../models/travelPick.models.js";
import AdminNotification from "../models/adminNotification.models.js";
import { createUserNotification } from "../utils/createUserNotification.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const subtractDays = (dateInput, days) => {
  const date = new Date(dateInput);
  date.setDate(date.getDate() - days);
  return date;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getFrontendUrl = () =>
  process.env.FRONTEND_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  "http://localhost:3000";

const formatPaymentResponse = (payment) => {
  const obj = payment.toObject ? payment.toObject() : payment;

  let balanceDueDate = null;
  let bookingCloseDate = null;

  if (obj.travelPick?.startDate) {
    balanceDueDate = subtractDays(obj.travelPick.startDate, 2);
    bookingCloseDate = subtractDays(obj.travelPick.startDate, 3);
  }

  return {
    ...obj,
    balanceDueDate,
    bookingCloseDate,
  };
};

const syncBookingPaymentState = async (bookingId) => {
  const booking = await Booking.findById(bookingId).populate("travelPick");

  if (!booking) return null;

  const completedPayments = await Payment.find({
    booking: booking._id,
    status: "completed",
  });

  const refundedPayments = await Payment.find({
    booking: booking._id,
    status: "refunded",
  });

  const hasAdvanceCompleted = completedPayments.some(
    (payment) => payment.paymentType === "advance"
  );

  const hasBalanceCompleted = completedPayments.some(
    (payment) => payment.paymentType === "balance"
  );

  const hasFullCompleted = completedPayments.some(
    (payment) => payment.paymentType === "full"
  );

  if (refundedPayments.length > 0) {
    booking.paymentStatus = "refunded";
    booking.bookingStatus = "cancelled";
  } else if (hasFullCompleted || (hasAdvanceCompleted && hasBalanceCompleted)) {
    booking.paymentStatus = "paid";
    booking.bookingStatus = "confirmed";
  } else if (hasAdvanceCompleted) {
    booking.paymentStatus = "advance_paid";
    booking.bookingStatus = "confirmed";
  } else {
    booking.paymentStatus = "unpaid";
    booking.bookingStatus = "pending";
  }

  await booking.save();

  return booking;
};

const isBookingStillOpen = (startDate) => {
  const bookingCloseDate = subtractDays(startDate, 3);
  const today = startOfToday();
  const bookingCloseDay = new Date(
    bookingCloseDate.getFullYear(),
    bookingCloseDate.getMonth(),
    bookingCloseDate.getDate()
  );

  return today < bookingCloseDay;
};

const getAmountForPaymentType = async (booking, paymentType) => {
  const populatedBooking =
    booking.travelPick?.startDate
      ? booking
      : await Booking.findById(booking._id).populate(
          "travelPick",
          "title place imageUrl startDate endDate caption price advancePercentage"
        );

  if (!populatedBooking || !populatedBooking.travelPick) {
    throw new Error("Travel pick not found for this booking");
  }

  const today = startOfToday();
  const balanceDueDate = subtractDays(populatedBooking.travelPick.startDate, 2);
  const balanceDueDay = new Date(
    balanceDueDate.getFullYear(),
    balanceDueDate.getMonth(),
    balanceDueDate.getDate()
  );

  let amount = 0;

  if (paymentType === "advance") {
    if (populatedBooking.paymentStatus !== "unpaid") {
      throw new Error("Advance payment is already completed or not allowed");
    }

    const existingAdvancePayment = await Payment.findOne({
      booking: populatedBooking._id,
      paymentType: "advance",
      status: "completed",
    });

    const existingFullPayment = await Payment.findOne({
      booking: populatedBooking._id,
      paymentType: "full",
      status: "completed",
    });

    if (existingAdvancePayment || existingFullPayment) {
      throw new Error("Advance or full payment already exists for this booking");
    }

    amount = Number(populatedBooking.advanceAmount);
  }

  if (paymentType === "balance") {
    if (populatedBooking.paymentStatus !== "advance_paid") {
      throw new Error(
        "Balance payment can be made only after advance payment"
      );
    }

    if (today >= balanceDueDay) {
      throw new Error(
        "Balance payment deadline has passed. It must be paid before 2 days of the trip."
      );
    }

    const existingBalancePayment = await Payment.findOne({
      booking: populatedBooking._id,
      paymentType: "balance",
      status: "completed",
    });

    if (existingBalancePayment) {
      throw new Error("Balance payment already exists for this booking");
    }

    amount = Number(populatedBooking.remainingAmount);
  }

  if (paymentType === "full") {
    if (populatedBooking.paymentStatus !== "unpaid") {
      throw new Error("Full payment is allowed only for unpaid bookings");
    }

    const existingFullPayment = await Payment.findOne({
      booking: populatedBooking._id,
      paymentType: "full",
      status: "completed",
    });

    const existingAdvancePayment = await Payment.findOne({
      booking: populatedBooking._id,
      paymentType: "advance",
      status: "completed",
    });

    if (existingFullPayment || existingAdvancePayment) {
      throw new Error("This booking already has a payment record");
    }

    amount = Number(populatedBooking.totalPrice);
  }

  return {
    amount,
    booking: populatedBooking,
  };
};

const createBookingForCheckout = async ({
  req,
  travelPickId,
  fullName,
  email,
  phone,
  travelersCount,
  specialNote,
}) => {
  if (!travelPickId || !isValidObjectId(travelPickId)) {
    throw new Error("Valid travel pick id is required");
  }

  if (!fullName || !email || !phone) {
    throw new Error("Full name, email, and phone are required");
  }

  const travelPick = await TravelPick.findOne({
    _id: travelPickId,
    isPublished: true,
  });

  if (!travelPick) {
    throw new Error("Travel pick not found");
  }

  if (!isBookingStillOpen(travelPick.startDate)) {
    throw new Error(
      "Booking is closed for this trip. Reservations close 3 days before departure."
    );
  }

  const count = Number(travelersCount || 1);

  if (Number.isNaN(count) || count < 1) {
    throw new Error("Travelers count must be at least 1");
  }

  const unitPrice = Number(travelPick.price);
  const totalPrice = unitPrice * count;
  const advancePercentage = Number(travelPick.advancePercentage || 0);
  const advanceAmount = (totalPrice * advancePercentage) / 100;
  const remainingAmount = totalPrice - advanceAmount;

  const booking = await Booking.create({
    user: req.user._id,
    travelPick: travelPick._id,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    travelersCount: count,
    specialNote: specialNote ? specialNote.trim() : "",
    unitPrice,
    totalPrice,
    advancePercentage,
    advanceAmount,
    remainingAmount,
  });

  await TravelPick.findByIdAndUpdate(travelPick._id, {
    $inc: { bookingCount: 1 },
  });

  const populatedBooking = await Booking.findById(booking._id).populate(
    "travelPick",
    "title place imageUrl startDate endDate caption price advancePercentage"
  );

  return populatedBooking;
};

export const createStripeCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        message: "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env",
      });
    }

    const {
      bookingId,
      travelPickId,
      fullName,
      email,
      phone,
      travelersCount,
      specialNote,
      paymentType,
    } = req.body;

    if (!paymentType || !["advance", "balance", "full"].includes(paymentType)) {
      return res.status(400).json({
        message: "Payment type must be advance, balance, or full",
      });
    }

    let booking;

    if (bookingId) {
      if (!isValidObjectId(bookingId)) {
        return res.status(400).json({ message: "Valid booking id is required" });
      }

      booking = await Booking.findOne({
        _id: bookingId,
        user: req.user._id,
      }).populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
    } else {
      booking = await createBookingForCheckout({
        req,
        travelPickId,
        fullName,
        email,
        phone,
        travelersCount,
        specialNote,
      });
    }

    const { amount, booking: finalBooking } = await getAmountForPaymentType(
      booking,
      paymentType
    );

    const title =
      finalBooking.travelPick?.title || "Travel package payment";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: finalBooking.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: `${title} - ${paymentType} payment`,
              description: `${finalBooking.travelPick?.place || ""} • ${
                finalBooking.travelersCount
              } traveler(s)`,
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(finalBooking._id),
        travelPickId: String(finalBooking.travelPick?._id || ""),
        userId: String(req.user._id),
        paymentType,
      },
      success_url: `${getFrontendUrl()}/travel-picks/${
        finalBooking.travelPick?._id
      }?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getFrontendUrl()}/travel-picks/${
        finalBooking.travelPick?._id
      }?payment=cancelled`,
    });

    return res.status(200).json({
      message: "Checkout session created",
      sessionId: session.id,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      bookingId: finalBooking._id,
      amount,
    });
  } catch (error) {
    console.error("createStripeCheckoutSession error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyStripeCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        message: "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env",
      });
    }

    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Stripe session not found" });
    }

    const bookingId = session.metadata?.bookingId;
    const travelPickId = session.metadata?.travelPickId;
    const paymentType = session.metadata?.paymentType;

    if (!bookingId || !paymentType) {
      return res.status(400).json({
        message: "Session metadata is incomplete",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    }).populate(
      "travelPick",
      "title place imageUrl startDate endDate caption price advancePercentage"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const existingPayment = await Payment.findOne({
      stripeCheckoutSessionId: session.id,
    })
      .populate("user", "username email")
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    if (existingPayment) {
      return res.status(200).json({
        message: "Payment already verified",
        payment: formatPaymentResponse(existingPayment),
        booking,
      });
    }

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        message: "Stripe payment is not completed yet",
      });
    }

    const { amount } = await getAmountForPaymentType(booking, paymentType);

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      travelPick: booking.travelPick._id,
      paymentType,
      amount,
      currency: "LKR",
      paymentMethod: "card",
      transactionId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : "",
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : "",
      note: "Paid with Stripe Checkout",
      status: "completed",
    });

    const updatedBooking = await syncBookingPaymentState(booking._id);

    await AdminNotification.create({
      type: "payment_completed",
      title: "New payment received",
      message: `${req.user.username} made a ${paymentType} payment for ${booking.travelPick.title}.`,
      actor: req.user._id,
      booking: booking._id,
      payment: payment._id,
      travelPick: travelPickId || booking.travelPick._id,
      isRead: false,
    });

    await createUserNotification({
      recipient: req.user._id,
      actor: null,
      type: "payment",
      title: "Payment successful",
      message: `Your ${paymentType} payment for ${booking.travelPick.title} was recorded successfully.`,
      entityType: "payment",
      entityId: payment._id,
      previewImage: booking.travelPick.imageUrl || "",
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("user", "username email")
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    return res.status(200).json({
      message: "Payment verified successfully",
      payment: formatPaymentResponse(populatedPayment),
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("verifyStripeCheckoutSession error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { bookingId, paymentType, paymentMethod, transactionId, note } = req.body;

    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Valid booking id is required" });
    }

    if (!paymentType || !["advance", "balance", "full"].includes(paymentType)) {
      return res.status(400).json({
        message: "Payment type must be advance, balance, or full",
      });
    }

    if (
      !paymentMethod ||
      !["card", "bank_transfer", "cash", "online_transfer", "other"].includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        message:
          "Payment method must be card, bank_transfer, cash, online_transfer, or other",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user._id,
    }).populate(
      "travelPick",
      "title place imageUrl startDate endDate caption price advancePercentage"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.travelPick) {
      return res.status(404).json({
        message: "Travel pick not found for this booking",
      });
    }

    const { amount } = await getAmountForPaymentType(booking, paymentType);

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      travelPick: booking.travelPick._id,
      paymentType,
      amount,
      paymentMethod,
      transactionId: transactionId ? transactionId.trim() : "",
      note: note ? note.trim() : "",
      status: "completed",
    });

    const updatedBooking = await syncBookingPaymentState(booking._id);

    await AdminNotification.create({
      type: "payment_completed",
      title: "New payment received",
      message: `${req.user.username} made a ${paymentType} payment for ${booking.travelPick.title}.`,
      actor: req.user._id,
      booking: booking._id,
      payment: payment._id,
      travelPick: booking.travelPick._id,
      isRead: false,
    });

    await createUserNotification({
      recipient: req.user._id,
      actor: null,
      type: "payment",
      title: "Payment successful",
      message: `Your ${paymentType} payment for ${booking.travelPick.title} was recorded successfully.`,
      entityType: "payment",
      entityId: payment._id,
      previewImage: booking.travelPick.imageUrl || "",
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("user", "username email")
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    return res.status(201).json({
      message: "Payment recorded successfully",
      payment: formatPaymentResponse(populatedPayment),
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("createPayment error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: payments.length,
      payments: payments.map((item) => formatPaymentResponse(item)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const payment = await Payment.findOne({
      _id: id,
      user: req.user._id,
    })
      .populate("user", "username email")
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      payment: formatPaymentResponse(payment),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminGetAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user", "username email role")
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus balanceDueDate"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: payments.length,
      payments: payments.map((item) => formatPaymentResponse(item)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminGetPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const payment = await Payment.findById(id)
      .populate("user", "username email role")
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus balanceDueDate"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      payment: formatPaymentResponse(payment),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const adminUpdatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId, note, status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (
      paymentMethod !== undefined &&
      !["card", "bank_transfer", "cash", "online_transfer", "other"].includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        message:
          "Payment method must be card, bank_transfer, cash, online_transfer, or other",
      });
    }

    if (
      status !== undefined &&
      !["completed", "failed", "refunded"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be completed, failed, or refunded",
      });
    }

    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (transactionId !== undefined) {
      payment.transactionId = transactionId ? transactionId.trim() : "";
    }
    if (note !== undefined) {
      payment.note = note ? note.trim() : "";
    }
    if (status !== undefined) payment.status = status;

    await payment.save();
    await syncBookingPaymentState(payment.booking);

    const updatedPayment = await Payment.findById(payment._id)
      .populate("user", "username email role")
      .populate(
        "booking",
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus balanceDueDate"
      )
      .populate(
        "travelPick",
        "title place imageUrl startDate endDate caption price advancePercentage"
      );

    return res.status(200).json({
      message: "Payment updated successfully",
      payment: formatPaymentResponse(updatedPayment),
    });
  } catch (error) {
    console.error("adminUpdatePayment error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const adminDeletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const bookingId = payment.booking;
    await payment.deleteOne();
    await syncBookingPaymentState(bookingId);

    return res.status(200).json({
      message: "Payment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};