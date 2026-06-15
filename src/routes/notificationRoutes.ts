import { Router } from "express";
import { requireApiKey } from "../middleware/auth.js";
import { send, getAll, getById, retry } from "../controllers/notificationController.js";

const router = Router();

router.use(requireApiKey);

router.post("/", send);
router.get("/", getAll);
router.get("/:id", getById);
router.post("/:id/retry", retry);

export { router as notificationRoutes };
