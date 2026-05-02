import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import pushRouter from "./push";
import trackingRouter from "./tracking";
import assistantRouter from "./assistant";
import gameRouter from "./game";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(pushRouter);
router.use(trackingRouter);
router.use(assistantRouter);
router.use(gameRouter);

export default router;
