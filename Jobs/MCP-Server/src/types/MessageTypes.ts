import {z} from "zod";

export interface IResumeMessage {
    final: z.ZodBoolean;
    docUrl: z.ZodString;
}

export interface IReferralMessage {
    final: z.ZodBoolean;
    message: z.ZodString;
}

