import { Router } from 'express';
import GoogleRoutes from './google-routes/google.routes.js'
import JobsRoute from "./job-routes/jobs.route.js";
import MCPRoute from "./mcp-routes/mcp.routes.js"

const router = Router();

router.use('/api', GoogleRoutes);
router.use('/api', JobsRoute);
router.use('/api', MCPRoute);

export default router;
