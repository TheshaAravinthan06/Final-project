import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import {
  searchForUsers,
  adminGlobalSearch,
} from "../controllers/search.controller.js";

const router = express.Router();

router.get("/users", protect, searchForUsers);
router.get("/admin", protect, authorize("admin"), adminGlobalSearch);

export default router;