type AuditLog = {
	_id: string;
	action: string;
	method: string;
	url: string;
	statusCode: number;
	user: string | null;
	userName: string;
	userRole: string;
	ipAddress: string;
	userAgent: string;
	requestBody: Record<string, unknown>;
	responseMessage: string;
	duration: number;
	level: "info" | "warn" | "error" | "critical";
	category: string;
	details: string;
	errorStack: string;
	createdAt: string;
	updatedAt: string;
};

type AuditLogStats = {
	totalLogs: number;
	last24hCount: number;
	errorCount24h: number;
	criticalCount24h: number;
	byCategory: { _id: string; count: number }[];
	byLevel: { _id: string; count: number }[];
	recentErrors: AuditLog[];
	hourlyActivity: { _id: number; count: number; errors: number }[];
};
