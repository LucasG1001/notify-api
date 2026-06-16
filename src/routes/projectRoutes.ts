import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getAll, create, update, rotateKey, remove } from "../controllers/projectController.js";

const router = Router();

router.use(requireAdmin);

router.get("/", getAll);
router.post("/", create);
router.put("/:id", update);
router.post("/:id/rotate-key", rotateKey);
router.delete("/:id", remove);

export { router as projectRoutes };
