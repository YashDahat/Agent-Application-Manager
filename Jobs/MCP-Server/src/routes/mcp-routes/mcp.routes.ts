import { Router } from "express";
import { MCPClientHandler } from "../../mcp/MCPClientHandler.js";
import { error } from "console";

const mcpClient = new MCPClientHandler();
mcpClient.connectToServer();
const router = Router();

router.post(
    '/create-resume',
    async (req, res) => {
        const { referenceResume, jobDetails, accessToken } = req.body;

        if( !referenceResume || !jobDetails ) {
            res.status(400).json({error:'Resume, Job details are required.'});
            return;
        }

        if( !accessToken ){
            res.status(401).json({error:'Unauthorized access'});
        }



        const prompt = await mcpClient.getPrompt('create-resume', {
            'ReferenceResume': referenceResume,
            'JobDetails': jobDetails
        });

        if(prompt){
            const message = prompt.messages[0].content.text;
            const llmResponse = await mcpClient.processQuery(message, String(accessToken));
            if(llmResponse){
                res.status(200).json(llmResponse);
                return;
            }
            res.status(500).json({error: 'Error while generating response from LLM. Contact support.'});
            return;
        }

        res.status(500).json({error: 'Prompt was not generated.'});
        return;
    }
);

router.post(
    '/create-referral-message',
    async (req, res) => {
        const { referenceResume, jobDetails, accessToken } = req.body;

        if( !referenceResume || !jobDetails ) {
            res.status(400).json({error:'Resume, Job details are required.'});
            return;
        }

        if( !accessToken ){
            res.status(401).json({error:'Unauthorized access'});
        }



        const prompt = await mcpClient.getPrompt('create-referral-message', {
            'ReferenceResume': referenceResume,
            'JobDetails': jobDetails
        });

        if(prompt){
            const message = prompt.messages[0].content.text;
            const llmResponse = await mcpClient.processQuery(message, String(accessToken));
            if(llmResponse){
                res.status(200).json(llmResponse);
                return;
            }
            res.status(500).json({error: 'Error while generating response from LLM. Contact support.'});
            return;
        }

        res.status(500).json({error: 'Prompt was not generated.'});
        return;
    }
);



export default router