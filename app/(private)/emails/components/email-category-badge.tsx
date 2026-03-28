"use client";

import { Badge } from "@components/ui/badge";

const categoryConfig: Record<EmailCategory, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
	NEW_RFQ: { label: "New RFQ", variant: "default", className: "bg-blue-600 hover:bg-blue-700" },
	RFQ_REMINDER: { label: "Reminder", variant: "secondary", className: "bg-orange-500 text-white hover:bg-orange-600" },
	RFQ_REOPENED: { label: "Reopened", variant: "secondary", className: "bg-amber-600 text-white hover:bg-amber-700" },
	REVISION_NEGOTIATION: { label: "Revision", variant: "secondary", className: "bg-yellow-500 text-white hover:bg-yellow-600" },
	PO_RELATED: { label: "PO", variant: "secondary", className: "bg-green-600 text-white hover:bg-green-700" },
	PO_DISCUSSION: { label: "PO Discussion", variant: "outline", className: "border-green-500 text-green-700" },
	DELIVERY_SCHEDULE: { label: "Delivery", variant: "secondary", className: "bg-purple-600 text-white hover:bg-purple-700" },
	MATERIAL_NOT_RECEIVED: { label: "Material Missing", variant: "destructive", className: "" },
	DRAWING_DOCUMENT: { label: "Drawing/Doc", variant: "outline", className: "border-sky-500 text-sky-700" },
	GENERAL: { label: "General", variant: "outline", className: "" },
};

interface EmailCategoryBadgeProps {
	category: EmailCategory;
	className?: string;
}

const EmailCategoryBadge = ({ category, className }: EmailCategoryBadgeProps) => {
	const config = categoryConfig[category] || categoryConfig.GENERAL;
	return (
		<Badge className={`text-[10px] ${config.className} ${className || ""}`} variant={config.variant}>
			{config.label}
		</Badge>
	);
};

export default EmailCategoryBadge;
