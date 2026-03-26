"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "@config/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Activity, AlertTriangle, ShieldAlert, Clock, Server } from "lucide-react";
import { format } from "date-fns";

const fetchStats = async () => {
	const response = await axios.get("/api/v1/audit-logs/stats");
	return response?.data?.data as AuditLogStats;
};

const fetchHealth = async () => {
	const response = await axios.get("/api/health");
	return response?.data;
};

export const AuditLogStats = () => {
	const { data: stats } = useQuery({
		queryKey: ["audit-log-stats"],
		queryFn: fetchStats,
		refetchInterval: 60000,
	});

	const { data: health } = useQuery({
		queryKey: ["system-health"],
		queryFn: fetchHealth,
		refetchInterval: 60000,
	});

	if (!stats) return null;

	const formatUptime = (seconds: number): string => {
		const d = Math.floor(seconds / 86400);
		const h = Math.floor((seconds % 86400) / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (d > 0) return `${d}d ${h}h ${m}m`;
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m`;
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Logs (24h)</CardTitle>
						<Activity className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.last24hCount.toLocaleString()}</div>
						<p className="text-muted-foreground text-xs">{stats.totalLogs.toLocaleString()} total all time</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
						<AlertTriangle className="h-4 w-4 text-orange-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">{stats.errorCount24h}</div>
						<p className="text-muted-foreground text-xs">error-level events</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Critical (24h)</CardTitle>
						<ShieldAlert className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">{stats.criticalCount24h}</div>
						<p className="text-muted-foreground text-xs">critical-level events</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
						<Clock className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{health?.uptime ? formatUptime(health.uptime) : "—"}</div>
						<p className="text-muted-foreground text-xs">since last restart</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">System Status</CardTitle>
						<Server className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<Badge
							className={health?.status === "OK" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
							variant="outline"
						>
							{health?.status || "Unknown"}
						</Badge>
						{health?.database && (
							<p className="text-muted-foreground mt-1 text-xs">
								DB: {health.database.status} | RAM: {health.memory?.heapUsed}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Category Breakdown & Recent Errors */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Activity by Category (7 days) */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Activity by Category (7 days)</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{stats.byCategory.map(item => {
								const maxCount = Math.max(...stats.byCategory.map(c => c.count));
								const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
								return (
									<div key={item._id} className="flex items-center gap-3">
										<span className="w-24 text-xs font-medium">{item._id}</span>
										<div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
											<div
												className="h-full rounded-full bg-blue-500 transition-all"
												style={{ width: `${pct}%` }}
											/>
										</div>
										<span className="text-muted-foreground w-12 text-right text-xs">{item.count}</span>
									</div>
								);
							})}
							{stats.byCategory.length === 0 && (
								<p className="text-muted-foreground text-center text-sm">No data</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Recent Errors */}
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Recent Errors & Critical Events</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="max-h-[300px] space-y-2 overflow-y-auto">
							{stats.recentErrors.map(err => (
								<div key={err._id} className="rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-900 dark:bg-red-950">
									<div className="flex items-center justify-between">
										<Badge
											className={err.level === "critical" ? "bg-red-200 text-red-900" : "bg-orange-100 text-orange-800"}
											variant="outline"
										>
											{err.level.toUpperCase()}
										</Badge>
										<span className="text-muted-foreground text-xs">
											{format(new Date(err.createdAt), "dd MMM HH:mm:ss")}
										</span>
									</div>
									<p className="mt-1 text-xs font-mono">{err.action}</p>
									<p className="text-muted-foreground mt-0.5 truncate text-xs">
										{err.responseMessage || err.details}
									</p>
								</div>
							))}
							{stats.recentErrors.length === 0 && (
								<p className="text-muted-foreground py-4 text-center text-sm">No recent errors</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Hourly Activity Chart (simple bar viz) */}
			{stats.hourlyActivity.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Hourly Activity (Last 24h)</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex h-32 items-end gap-1">
							{Array.from({ length: 24 }, (_, hour) => {
								const data = stats.hourlyActivity.find(h => h._id === hour);
								const count = data?.count || 0;
								const errors = data?.errors || 0;
								const maxCount = Math.max(...stats.hourlyActivity.map(h => h.count), 1);
								const heightPct = (count / maxCount) * 100;
								const errorPct = count > 0 ? (errors / count) * 100 : 0;

								return (
									<div key={hour} className="group relative flex flex-1 flex-col items-center">
										<div className="relative w-full" style={{ height: `${Math.max(heightPct, 2)}%` }}>
											<div className="absolute inset-0 rounded-t bg-blue-400 transition-colors group-hover:bg-blue-500" />
											{errorPct > 0 && (
												<div
													className="absolute bottom-0 w-full rounded-t bg-red-400"
													style={{ height: `${errorPct}%` }}
												/>
											)}
										</div>
										{hour % 4 === 0 && (
											<span className="text-muted-foreground mt-1 text-[10px]">{hour}h</span>
										)}
										{/* Tooltip */}
										<div className="pointer-events-none absolute -top-10 z-10 hidden rounded bg-black px-2 py-1 text-[10px] text-white group-hover:block">
											{hour}:00 — {count} req{errors > 0 ? `, ${errors} err` : ""}
										</div>
									</div>
								);
							})}
						</div>
						<div className="mt-2 flex gap-4 text-xs">
							<div className="flex items-center gap-1">
								<div className="h-2.5 w-2.5 rounded bg-blue-400" />
								<span className="text-muted-foreground">Requests</span>
							</div>
							<div className="flex items-center gap-1">
								<div className="h-2.5 w-2.5 rounded bg-red-400" />
								<span className="text-muted-foreground">Errors</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
};
