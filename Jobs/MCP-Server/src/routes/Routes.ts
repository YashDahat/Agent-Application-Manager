import { Router } from 'express';
import GoogleRoutes from './google-routes/google.routes.js'
import JobsRoute from "./job-routes/jobs.route.js";

const router = Router();

router.use('/api', GoogleRoutes);
router.use('/api', JobsRoute);

export default router;
