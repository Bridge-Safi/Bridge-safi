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
import couponsRouter from "./coupons";
import visitsRouter from "./visits";
import missionsRouter from "./missions";
import managerRouter from "./manager";
import financeRouter from "./finance";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(ordersRouter);
router.use(pushRouter);
router.use(trackingRouter);
router.use(assistantRouter);
router.use(gameRouter);
router.use(profilesRouter);
router.use(restaurantProfileRouter);
router.use(adminRouter);
router.use(couponsRouter);
router.use(visitsRouter);
router.use(missionsRouter);
router.use(managerRouter);
router.use(financeRouter);

export default router;
