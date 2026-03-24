import mongoose from "mongoose";
import Payment from "../models/payment.models.js";
import Booking from "../models/booking.models.js";

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

  if (refundedPayments.length > 0) {
    booking.paymentStatus = "refunded";
    booking.bookingStatus = "cancelled";
  } else if (hasAdvanceCompleted && hasBalanceCompleted) {
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

export const createPayment = async (req, res) => {
  try {
    const { bookingId, paymentType, paymentMethod, transactionId, note } = req.body;

    if (!bookingId || !isValidObjectId(bookingId)) {
      return res.status(400).json({ message: "Valid booking id is required" });
    }

    if (!paymentType || !["advance", "balance"].includes(paymentType)) {
      return res.status(400).json({
        message: "Payment type must be either advance or balance",
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
      return res.status(404).json({ message: "Travel pick not found for this booking" });
    }

    const today = startOfToday();
    const balanceDueDate = subtractDays(booking.travelPick.startDate, 2);
    const balanceDueDay = new Date(
      balanceDueDate.getFullYear(),
      balanceDueDate.getMonth(),
      balanceDueDate.getDate()
    );

    let amount = 0;

    if (paymentType === "advance") {
      if (booking.paymentStatus !== "unpaid") {
        return res.status(400).json({
          message: "Advance payment is already completed or not allowed",
        });
      }

      const existingAdvancePayment = await Payment.findOne({
        booking: booking._id,
        paymentType: "advance",
        status: "completed",
      });

      if (existingAdvancePayment) {
        return res.status(400).json({
          message: "Advance payment already exists for this booking",
        });
      }

      amount = Number(booking.advanceAmount);
    }

    if (paymentType === "balance") {
      if (booking.paymentStatus !== "advance_paid") {
        return res.status(400).json({
          message: "Balance payment can be made only after advance payment",
        });
      }

      if (today >= balanceDueDay) {
        return res.status(400).json({
          message:
            "Balance payment deadline has passed. It must be paid before 2 days of the trip.",
        });
      }

      const existingBalancePayment = await Payment.findOne({
        booking: booking._id,
        paymentType: "balance",
        status: "completed",
      });

      if (existingBalancePayment) {
        return res.status(400).json({
          message: "Balance payment already exists for this booking",
        });
      }

      amount = Number(booking.remainingAmount);
    }

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

    await syncBookingPaymentState(booking._id);

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
        "fullName email phone travelersCount totalPrice advanceAmount remainingAmount bookingStatus paymentStatus"
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

