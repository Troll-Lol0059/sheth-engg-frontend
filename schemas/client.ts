import { z } from "zod";

export const ClientSchema = z.object({
	companyName: z.string().min(1, "Company name is required"),
	gstn: z.string().optional().default(""),
	location: z.string().optional().default(""),
	addressLine1: z.string().optional().default(""),
	addressLine2: z.string().optional().default(""),
	addressLine3: z.string().optional().default(""),
	state: z.string().optional().default(""),
	city: z.string().optional().default(""),
	pincode: z.string().optional().default(""),
	country: z.string().optional().default(""),
	buyerName: z.string().optional().default(""),
	buyerContact: z.string().optional().default(""),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
