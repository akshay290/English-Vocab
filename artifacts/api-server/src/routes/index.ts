import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import vocabularyRouter from "./vocabulary.js";
import testsRouter from "./tests.js";
import progressRouter from "./progress.js";
import revisionRouter from "./revision.js";
import statsRouter from "./stats.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(vocabularyRouter);
router.use(testsRouter);
router.use(progressRouter);
router.use(revisionRouter);
router.use(statsRouter);
router.use(adminRouter);

export default router;
