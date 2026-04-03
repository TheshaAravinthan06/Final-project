import express from "express";
import {
  createPayment,
  createStripeCheckoutSession,
  verifyStripeCheckoutSession,
  getMyPayments,
  getMyPaymentById,
  adminGetAllPayments,
  adminGetPaymentById,
  adminUpdatePayment,
  adminDeletePayment,
} from "../controllers/payment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/", protect, createPayment);
router.post("/checkout-session", protect, createStripeCheckoutSession);
router.get("/verify-session", protect, verifyStripeCheckoutSession);

router.get("/my-payments", protect, getMyPayments);
router.get("/my-payments/:id", protect, getMyPaymentById);

router.get("/admin/all", protect, authorize("admin"), adminGetAllPayments);
router.get("/admin/:id", protect, authorize("admin"), adminGetPaymentById);
router.patch("/admin/:id", protect, authorize("admin"), adminUpdatePayment);
router.delete("/admin/:id", protect, authorize("admin"), adminDeletePayment);

export default router;