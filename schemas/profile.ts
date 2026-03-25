import { z } from "zod";
import validator from "validator";

export const UpdateProfileSchema = z.object({
	firstName: z
		.string()
		.min(1, "First name is required")
		.max(50, "Should contain max of 50 characters!")
		.refine(val => validator.isAlpha(val, "en-US", { ignore: " -" }), "Only letters, spaces and hyphens allowed!"),
	middleName: z
		.string()
		.max(30, "Should contain max of 30 characters!")
		.optional()
		.default("")
		.refine(val => !val || validator.isAlpha(val, "en-US", { ignore: " -" }), "Only letters, spaces and hyphens allowed!"),
	lastName: z
		.string()
		.min(1, "Last name is required")
		.max(50, "Should contain max of 50 characters!")
		.refine(val => validator.isAlpha(val, "en-US", { ignore: " -" }), "Only letters, spaces and hyphens allowed!"),
	phoneNumber: z.string().max(20, "Should contain max of 20 characters!").optional().default(""),
});

export const ChangePasswordSchema = z
	.object({
		oldPassword: z.string().min(1, "Old password is required"),
		newPassword: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine(data => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export type UpdateProfileFormValues = z.infer<typeof UpdateProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;
