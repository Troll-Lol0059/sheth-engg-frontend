import { z } from "zod";
import validator from "validator";

export const CompanyProfileSchema = z.object({
	name: z
		.string()
		.min(1, "Company name is required")
		.max(100, "Should contain max of 100 characters!")
		.refine(val => validator.isAlphanumeric(val, "en-US", { ignore: " &.,'-" }), "Invalid characters found!"),
	tagline: z.string().max(200, "Should contain max of 200 characters!").optional().default(""),
	gstin: z
		.string()
		.max(15, "GSTIN must be 15 characters or fewer")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlphanumeric(val, "en-US"), "GSTIN should only contain alphanumeric characters!"),
	vendorCode: z
		.string()
		.max(30, "Should contain max of 30 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlphanumeric(val, "en-US", { ignore: " -" }), "Invalid characters found!"),
	addressLine1: z
		.string()
		.max(100, "Should contain max of 100 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlphanumeric(val, "en-US", { ignore: " @#%&?!,.:()-/" }), "Invalid characters found!"),
	addressLine2: z
		.string()
		.max(100, "Should contain max of 100 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlphanumeric(val, "en-US", { ignore: " @#%&?!,.:()-/" }), "Invalid characters found!"),
	city: z
		.string()
		.max(30, "Should contain max of 30 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlpha(val, "en-US", { ignore: " -" }), "Invalid characters found!"),
	state: z
		.string()
		.max(30, "Should contain max of 30 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlpha(val, "en-US", { ignore: " -" }), "Invalid characters found!"),
	pincode: z
		.string()
		.max(10, "Should contain max of 10 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isPostalCode(val, "any"), "Invalid pincode!"),
	country: z
		.string()
		.max(30, "Should contain max of 30 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlpha(val, "en-US", { ignore: " -" }), "Invalid characters found!"),
	phone: z.string().max(20, "Should contain max of 20 characters!").optional().default(""),
	email: z
		.string()
		.optional()
		.default("")
		.refine(val => !val || validator.isEmail(val), "Invalid email!"),
	contactPersonName: z
		.string()
		.max(50, "Should contain max of 50 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlpha(val, "en-US", { ignore: " -." }), "Only letters, spaces and hyphens allowed!"),
	contactPersonPhone: z.string().max(20, "Should contain max of 20 characters!").optional().default(""),
	contactPersonEmail: z
		.string()
		.optional()
		.default("")
		.refine(val => !val || validator.isEmail(val), "Invalid email!"),
});

export type CompanyProfileFormValues = z.infer<typeof CompanyProfileSchema>;
