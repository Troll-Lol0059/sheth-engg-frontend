import { z } from "zod";

export const BusinessOverviewSchema = z.object({
	industry: z.array(z.string()).min(1, "This field is required!"),
	problemTargeted: z.string().min(1, { message: "This field is required!" }),
	description: z.string().min(1, { message: "This field is required!" }),
	uniqueValueProposition: z.string().min(1, { message: "This field is required!" }),
	vision: z.string().min(1, { message: "This field is required!" }),
	mission: z.string().min(1, { message: "This field is required!" }),
});

export const BusinessModelSchemas = z.object({
	descriptionOfRevenueModel: z.string().min(5, { message: "Should contain min of 5 characters!" }),
	keyCustomersAndTargetMarket: z.string().min(5, { message: "Should contain min of 5 characters!" }),
	distributionChannels: z.string().min(5, { message: "Should contain min of 5 characters!" }),
	customerAcquisitionStrategy: z.string().min(5, { message: "Should contain min of 5 characters!" }),
});