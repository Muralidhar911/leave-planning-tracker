import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import leavesRouter from "./leaves";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(leavesRouter);
router.use(insightsRouter);

export default router;
