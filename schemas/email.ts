import { z } from "zod";

export const EmailSettingsSchema = z.object({
	imapHost: z.string().min(1, "IMAP host is required"),
	imapPort: z.coerce.number().min(1).max(65535),
	imapUser: z.string().min(1, "IMAP user is required"),
	imapPassword: z.string().optional(),
	imapTls: z.boolean(),
	syncEnabled: z.boolean(),
	syncIntervalMinutes: z.coerce.number().min(5).max(60),
	aribaUsername: z.string().optional(),
	aribaPassword: z.string().optional(),
	aribaAutoDownload: z.boolean(),
});

export type EmailSettingsFormValues = z.infer<typeof EmailSettingsSchema>;

export const LinkRfqSchema = z.object({
	rfqId: z.string().min(1, "Please select an RFQ"),
});

export type LinkRfqFormValues = z.infer<typeof LinkRfqSchema>;

export const LinkPoSchema = z.object({
	poId: z.string().min(1, "Please select a PO"),
});

export type LinkPoFormValues = z.infer<typeof LinkPoSchema>;
