import { Router } from "express";
import { requireApiKey } from "../middleware/auth.js";
import { getAll, create, update, remove } from "../controllers/channelController.js";

const router = Router();

router.use(requireApiKey);

router.get("/", getAll);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export { router as channelRoutes };
