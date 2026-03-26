"use client";
import { useState } from "react";
import axios from "@config/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, AlertTriangle, ArrowRightLeft, Award, Loader2 } from "lucide-react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { ScrollArea } from "@components/ui/scroll-area";
import { Separator } from "@components/ui/separator";
import { cn } from "@lib/utils";

type NotificationType = "DUE_DATE_REMINDER" | "STATUS_CHANGE" | "ORDER_AWARDED";

type NotificationItem = {
	_id: string;
	message: string;
	type: NotificationType;
	prNumber: string;
	isRead: boolean;
	createdAt: string;
	rfq?: {
		_id: string;
		prNumber: string;
		companyName: string;
		status: string;
	};
};

type NotificationResponse = {
	data: NotificationItem[];
	unreadCount: number;
	totalCount: number;
	page: number;
	size: number;
	totalPages: number;
};

const typeConfig: Record<NotificationType, { icon: typeof Bell; colorClass: string }> = {
	DUE_DATE_REMINDER: { icon: AlertTriangle, colorClass: "text-amber-600" },
	STATUS_CHANGE: { icon: ArrowRightLeft, colorClass: "text-blue-600" },
	ORDER_AWARDED: { icon: Award, colorClass: "text-green-600" },
};

function timeAgo(dateStr: string): string {
	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return "just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay}d ago`;
	return date.toLocaleDateString();
}

const NotificationBell = () => {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);

	const { data: countData } = useQuery<{ unreadCount: number }>({
		queryKey: ["notification-unread-count"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/notification/unread-count");
			return res?.data?.data;
		},
		refetchInterval: 30_000,
	});

	const { data: notifData, isLoading } = useQuery<NotificationResponse>({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/notification/all?page=1&size=30");
			return res?.data?.data;
		},
		enabled: open,
	});

	const { mutate: markAllRead } = useMutation({
		mutationFn: () => axios.patch("/api/v1/notification/read-all"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
		},
	});

	const { mutate: markOneRead } = useMutation({
		mutationFn: (id: string) => axios.patch(`/api/v1/notification/${id}/read`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
		},
	});

	const unread = countData?.unreadCount ?? 0;
	const notifications = notifData?.data ?? [];

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button size="icon" variant="ghost">
					<div className="relative flex size-8 items-center justify-center">
						<Bell size={20} />
						{unread > 0 && (
							<span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
								{unread > 99 ? "99+" : unread}
							</span>
						)}
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-96 p-0" sideOffset={8}>
				<div className="flex items-center justify-between px-4 py-3">
					<h4 className="text-sm font-semibold">Notifications</h4>
					{unread > 0 && (
						<Button className="h-7 text-xs" onClick={() => markAllRead()} size="sm" variant="ghost">
							<CheckCheck className="mr-1 h-3 w-3" />
							Mark all read
						</Button>
					)}
				</div>
				<Separator />
				<ScrollArea className="max-h-[400px]">
					{isLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
						</div>
					) : notifications.length === 0 ? (
						<div className="py-8 text-center">
							<Bell className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
							<p className="text-muted-foreground text-sm">No notifications yet</p>
						</div>
					) : (
						<div>
							{notifications.map(n => {
								const config = typeConfig[n.type];
								const Icon = config.icon;
								return (
									<button
										className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50", !n.isRead && "bg-muted/30")}
										key={n._id}
										onClick={() => {
											if (!n.isRead) markOneRead(n._id);
										}}
										type="button"
									>
										<div className={cn("mt-0.5 shrink-0", config.colorClass)}>
											<Icon className="h-4 w-4" />
										</div>
										<div className="min-w-0 flex-1">
											<p className={cn("text-sm leading-snug", !n.isRead && "font-medium")}>{n.message}</p>
											<div className="mt-1 flex items-center gap-2">
												<Badge className="text-[10px]" variant="outline">
													{n.type.replace(/_/g, " ")}
												</Badge>
												<span className="text-muted-foreground text-[11px]">{timeAgo(n.createdAt)}</span>
											</div>
										</div>
										{!n.isRead && <div className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />}
									</button>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
};

export default NotificationBell;
