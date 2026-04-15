import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import pushRouter from "./push";
import driverRouter from "./driver";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(pushRouter);
router.use(driverRouter);

export default router;
