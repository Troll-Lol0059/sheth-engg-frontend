"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@components/ui/dialog";
import { Badge } from "@components/ui/badge";
import { format } from "date-fns";

interface AuditLogDetailProps {
	log: AuditLog;
	onClose: () => void;
}

const levelColors: Record<string, string> = {
	info: "bg-blue-100 text-blue-800",
	warn: "bg-yellow-100 text-yellow-800",
	error: "bg-red-100 text-red-800",
	critical: "bg-red-200 text-red-900",
};

export const AuditLogDetail = ({ log, onClose }: AuditLogDetailProps) => {
	return (
		<Dialog open={!!log} onOpenChange={() => onClose()}>
			<DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Audit Log Detail
						<Badge className={levelColors[log.level] || ""} variant="outline">
							{log.level.toUpperCase()}
						</Badge>
					</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-4 text-sm">
					<DetailField label="Timestamp" value={format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss.SSS")} />
					<DetailField label="Action" value={log.action} mono />
					<DetailField label="Method" value={log.method} />
					<DetailField label="Status Code" value={String(log.statusCode)} />
					<DetailField label="Category" value={log.category} />
					<DetailField label="Duration" value={`${log.duration}ms`} />
					<DetailField label="User" value={log.userName} />
					<DetailField label="Role" value={log.userRole} />
					<DetailField label="IP Address" value={log.ipAddress || "N/A"} />
					<div className="col-span-2">
						<DetailField label="Endpoint" value={log.url} mono />
					</div>
					<div className="col-span-2">
						<DetailField label="Response Message" value={log.responseMessage || "—"} />
					</div>
					<div className="col-span-2">
						<DetailField label="Details" value={log.details || "—"} />
					</div>
					{log.userAgent && (
						<div className="col-span-2">
							<DetailField label="User Agent" value={log.userAgent} />
						</div>
					)}
					{log.requestBody && Object.keys(log.requestBody).length > 0 && (
						<div className="col-span-2">
							<span className="text-muted-foreground mb-1 block text-xs font-medium">Request Body</span>
							<pre className="bg-muted max-h-[200px] overflow-auto rounded-md p-3 text-xs">
								{JSON.stringify(log.requestBody, null, 2)}
							</pre>
						</div>
					)}
					{log.errorStack && (
						<div className="col-span-2">
							<span className="text-muted-foreground mb-1 block text-xs font-medium">Error Stack</span>
							<pre className="max-h-[200px] overflow-auto rounded-md bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950 dark:text-red-200">
								{log.errorStack}
							</pre>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

const DetailField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
	<div>
		<span className="text-muted-foreground block text-xs font-medium">{label}</span>
		<span className={`block text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
	</div>
);
