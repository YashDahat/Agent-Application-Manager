import {Router} from 'express';
import {getJobDetails, getJobsListV2} from "../../services/jobs-service/JobsService.js";
const router = Router();

router.post("/get_jobs", async (req, res) => {
    try {
        const { role, location, date_posted } = req.body;
        if (!role || !location || !date_posted) {
            res.status(400).json({ error: "Missing role, location, or date_posted in request body." });
        }else{
            console.log('Role:', role, ', Location:', location, ', Date posted:', date_posted);
            const response = await getJobsListV2(role, location, date_posted);
            res.status(200).json(response);
        }
    } catch (error) {
        console.error("Error fetching job listings:", error);
        res.status(500).json({ error: "Failed to fetch job listings." });
    }
});

router.get("/get_job_details", async (req, res) => {
    const { jobId } = req.query;

    if (!jobId || typeof jobId !== 'string') {
        res.status(400).json({ error: "Missing or invalid 'jobId' parameter" });
    }else{
        try {
            const jobDetails = await getJobDetails(jobId);
            res.status(200).json(jobDetails);
        } catch (error) {
            console.error("Error fetching job details:", error);
            res.status(500).json({ error: "Failed to fetch job details" });
        }
    }
});

export default router;