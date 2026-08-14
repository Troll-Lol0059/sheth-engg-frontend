type EmailCategory =
	| "NEW_RFQ"
	| "RFQ_REMINDER"
	| "RFQ_REOPENED"
	| "REVISION_NEGOTIATION"
	| "PO_RELATED"
	| "PO_DISCUSSION"
	| "DELIVERY_SCHEDULE"
	| "MATERIAL_NOT_RECEIVED"
	| "DISPATCH_STATUS_REQUEST"
	| "DRAWING_DOCUMENT"
	| "GENERAL";

type AribaDownloadStatus = "LINK_EXTRACTED" | "DOWNLOADING" | "DOWNLOADED" | "FAILED";

type EmailSource = "ARIBA" | "DIRECT" | "UNKNOWN";

type EmailAddress = {
	name: string;
	address: string;
};

type EmailAttachment = {
	_id: string;
	filename: string;
	contentType: string;
	size: number;
	cloudinaryUrl?: string;
	cloudinaryPublicId?: string;
};

type AribaLink = {
	_id: string;
	url: string;
	downloadedDocUrl?: string;
	downloadStatus: AribaDownloadStatus;
	errorMessage?: string;
};

type EmailClassification = {
	category: EmailCategory;
	confidence: number;
	extractedData: {
		prNumbers: string[];
		poNumbers: string[];
		companyNames: string[];
		contactPerson?: string;
		contactEmail?: string;
		contactPhone?: string;
		location?: string;
		eventStartDate?: string;
		dueDate?: string;
		actionItems: string[];
		summary: string;
	};
};

type EmailRecord = {
	_id: string;
	messageId: string;
	uid: number;
	from: EmailAddress;
	to: EmailAddress[];
	cc: EmailAddress[];
	subject: string;
	textBody: string;
	htmlBody: string;
	date: string;
	attachments: EmailAttachment[];
	aribaLinks: AribaLink[];
	classification: EmailClassification;
	dispatchRequests: { poNumber: string; itemCode?: string }[];
	linkedRfq?: {
		_id: string;
		prNumber: string;
		companyName: string;
		status: string;
	} | null;
	isRead: boolean;
	isProcessed: boolean;
	isArchived: boolean;
	isDeleted: boolean;
	source: EmailSource;
	createdAt: string;
	updatedAt: string;
};

type EmailStats = Record<EmailCategory | "total", number>;

type EmailSettings = {
	imapHost: string;
	imapPort: number;
	imapUser: string;
	imapTls: boolean;
	syncEnabled: boolean;
	syncIntervalMinutes: number;
	lastSyncAt?: string;
	lastSyncUid?: number;
	aribaUsername: string;
	aribaAutoDownload: boolean;
	hasImapPassword: boolean;
	hasAribaPassword: boolean;
	senderWhitelist: string[];
};

type EmailCreateRfqPrefill = {
	documentUrl: string | null;
	prNumber: string;
	companyName: string;
	location: string;
	startDate: string | null;
	dueDate: string | null;
	emailId: string;
	source: EmailSource;
	attachments: EmailAttachment[];
	aribaLinks: AribaLink[];
};
