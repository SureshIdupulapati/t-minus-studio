import { Router, type IRouter } from "express";
import healthRouter from "./health";
import planningRouter from "./planning";
import designSuggestionsRouter from "./design-suggestions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(planningRouter);
router.use(designSuggestionsRouter);

export default router;
