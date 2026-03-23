import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import leavesRouter from "./leaves.js";
import insightsRouter from "./insights.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(leavesRouter);
router.use(insightsRouter);

export default router;
