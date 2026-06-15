import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getAll, create, rotateKey, remove } from "../controllers/projectController.js";

const router = Router();

router.use(requireAdmin);

router.get("/", getAll);
router.post("/", create);
router.post("/:id/rotate-key", rotateKey);
router.delete("/:id", remove);

export { router as projectRoutes };
