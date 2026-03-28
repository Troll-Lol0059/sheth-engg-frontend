"use client";

import axios from "@config/axios";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@components/ui/button";

const EmailBadge = () => {
	const router = useRouter();

	const { data } = useQuery<{ unreadCount: number }>({
		queryKey: ["email-unread-count"],
		queryFn: async () => {
			const res = await axios.get("/api/v1/email/unread-count");
			return res?.data?.data;
		},
		refetchInterval: 30_000,
	});

	const unread = data?.unreadCount ?? 0;

	return (
		<Button onClick={() => router.push("/emails")} size="icon" variant="ghost">
			<div className="relative flex size-8 items-center justify-center">
				<Mail size={20} />
				{unread > 0 && (
					<span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
						{unread > 99 ? "99+" : unread}
					</span>
				)}
			</div>
		</Button>
	);
};

export default EmailBadge;
