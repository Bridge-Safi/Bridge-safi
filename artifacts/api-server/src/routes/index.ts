import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(pushRouter);

export default router;
