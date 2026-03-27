"use client";
import Link from "next/link";
import Image from "next/image";
import { logo, logoIcon } from "@assets";
import { cn } from "@lib/utils";
import { useState } from "react";
import { APP_NAME } from "@data";
import MenuItem from "./menu-item";
import useSession from "@store/session";
import { useRouter } from "next/navigation";
import { toast } from "@components/ui/toaster";
import { Button } from "@components/ui/button";
import { ChevronLeft, LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@components/ui/scroll-area";
import CollapsibleMenuItem from "./collapsible-menu-item";

type SidebarProps = {
	menuItems: MenuItem[];
};

const Sidebar = ({ menuItems }: SidebarProps) => {
	const router = useRouter();
	const { setSession } = useSession();
	const [sidebarIsOpen, setSidebarIsOpen] = useState<boolean>(true);
	const [onLogoutToast, setOnLogoutToast] = useState<string | number>();

	async function onLogout() {
		setOnLogoutToast(toast.loading("Loading...", { description: "Please wait while we Logout you!" }));
		await fetch("/api/auth/logout", { method: "POST" });
	}

	const { mutate, isPending } = useMutation({
		mutationFn: onLogout,
		onSuccess: () => {
			toast.success("Success!", { id: onLogoutToast, description: "You've successfully logged out!" });
			router.replace("/auth/login");
			setSession(null);
		},
		onError: () => {
			toast.error("Error!", { id: onLogoutToast, description: "An error occurred while logging out!" });
		},
	});

	return (
		<aside
			className={cn(
				"border-border bg-background sticky inset-y-0 left-0 z-20 hidden h-screen shrink-0 -translate-x-full border-r py-5 transition-[width] duration-300 ease-in-out lg:flex lg:translate-x-0 lg:flex-col lg:items-center lg:justify-between",
				sidebarIsOpen ? "w-60 px-5" : "w-20 px-2"
			)}
		>
			<Button className="bg-accent absolute top-4 -right-4 hidden size-8 lg:flex" onClick={() => setSidebarIsOpen(!sidebarIsOpen)} size="icon" variant="ghost">
				<ChevronLeft className={cn("transition-transform duration-300 ease-in-out", sidebarIsOpen ? "rotate-0" : "rotate-180")} size={16} />
			</Button>
			<Button className="transition-transform duration-300 ease-in-out" size={sidebarIsOpen ? "default" : "icon"} variant="ghost" asChild>
				<Link href="/">
					{sidebarIsOpen ? (
						<Image alt={APP_NAME} src={logo} width={160} height={40} priority />
					) : (
						<Image alt={APP_NAME} src={logoIcon} width={32} height={32} priority />
					)}
				</Link>
			</Button>
			<ScrollArea className="flex w-full flex-col items-center justify-center gap-2">
				<ul className="flex w-full flex-col items-center justify-center gap-1">
					{menuItems?.map((item: MenuItem) => (
						<li className="flex w-full items-center justify-center gap-1" key={item?.uuid}>
							{item?.submenus?.length ? <CollapsibleMenuItem menuItem={item} sidebarIsOpen={sidebarIsOpen} /> : <MenuItem menuItem={item} sidebarIsOpen={sidebarIsOpen} />}
						</li>
					))}
				</ul>
			</ScrollArea>
			<Button className="transition-transform duration-300 ease-in-out" disabled={isPending} onClick={() => mutate()} size={sidebarIsOpen ? "default" : "icon"} variant="ghost">
				<LogOut />
				<span className={cn("transition-transform duration-300 ease-in-out", sidebarIsOpen ? "translate-x-0" : "hidden -translate-x-96")}>Logout</span>
			</Button>
		</aside>
	);
};

export default Sidebar;
