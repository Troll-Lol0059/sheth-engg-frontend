import { z } from "zod";
import validator from "validator";
import { isValidNumber } from "@lib/contactValidator";

export const LoginSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const RegistrationSchema = z
	.object({
		firstName: z
			.string()
			.min(1, "First name is required")
			.refine(val => validator.isAlpha(val, "en-US", { ignore: " -" }), "Only letters, spaces and hyphens allowed"),
		middleName: z.string().optional(),
		lastName: z
			.string()
			.min(1, "Last name is required")
			.refine(val => validator.isAlpha(val, "en-US", { ignore: " -" }), "Only letters, spaces and hyphens allowed"),
		email: z
			.string()
			.min(1, "Email is required")
			.refine(val => validator.isEmail(val), "Invalid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		contactNo: z
			.string()
			.min(1, "Contact number is required")
			.refine(val => isValidNumber(val), "Invalid phone number"),
		address: z.object({
			addressLine1: z.string().min(1, "Address line 1 is required"),
			addressLine2: z.string().optional(),
			city: z.string().min(1, "City is required"),
			province: z.string().optional(),
			countryUuid: z.string().min(1, "Country is required"),
			zipCode: z
				.string()
				.min(1, "ZIP code is required")
				.refine(val => validator.isPostalCode(val, "any"), "Invalid ZIP code"),
		}),
		agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
	})
	.refine(data => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const ForgotPasswordSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.refine(val => validator.isEmail(val), "Invalid email address"),
});

export const ResetPasswordSchema = z
	.object({
		newPassword: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine(data => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const VerificationSchema = z.object({
	otp: z.string().length(6, "OTP must be 6 digits"),
});
