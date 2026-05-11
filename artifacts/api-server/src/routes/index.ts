import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import pushRouter from "./push";
import trackingRouter from "./tracking";
import assistantRouter from "./assistant";
import gameRouter from "./game";
import profilesRouter from "./profiles";
import restaurantProfileRouter from "./restaurant-profile";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(pushRouter);
router.use(trackingRouter);
router.use(assistantRouter);
router.use(gameRouter);
router.use(profilesRouter);
router.use(restaurantProfileRouter);
router.use(adminRouter);

export default router;
