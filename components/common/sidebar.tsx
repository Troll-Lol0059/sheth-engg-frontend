"use client";
import Link from "next/link";
import { logo } from "@assets";
import Image from "next/image";
import { cn } from "@lib/utils";
import { useState } from "react";
import { APP_NAME } from "@data";
import axios from "@config/axios";
import { AxiosError } from "axios";
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
		await axios.post("/user-management/api/auth/logout");
	}

	const { mutate, isPending } = useMutation({
		mutationFn: onLogout,
		onSuccess: () => {
			toast.success("Success!", { id: onLogoutToast, description: "You've successfully logged out!" });
			router.push(`${process.env.NEXT_PUBLIC_VCOSMOS_USER_MANAGEMENT_URL}/auth/login`);
			setSession(null);
		},
		onError: (error: unknown) => {
			const errorData = (error as AxiosError)?.response?.data as ErrorData;
			toast.error("Error!", { id: onLogoutToast, description: errorData?.message || "An error occured!" });
		},
	});

	return (
		<aside
			className={cn(
				"border-border bg-background sticky inset-y-0 left-0 z-20 hidden h-screen shrink-0 -translate-x-full border-r py-5 transition-[width] duration-300 ease-in-out lg:flex lg:translate-x-0 lg:flex-col lg:items-center lg:justify-between",
				sidebarIsOpen ? "w-72 px-5" : "w-20 px-2"
			)}
		>
			<Button className="bg-accent absolute top-4 -right-4 hidden size-8 lg:flex" onClick={() => setSidebarIsOpen(!sidebarIsOpen)} size="icon" variant="ghost">
				<ChevronLeft className={cn("transition-transform duration-300 ease-in-out", sidebarIsOpen ? "rotate-0" : "rotate-180")} size={16} />
			</Button>
			<Button className="transition-transform duration-300 ease-in-out" size={sidebarIsOpen ? "default" : "icon"} variant="ghost" asChild>
				<Link href="/">
					<Image alt="Logo" height={32} priority src={logo} width={32} />
					<h1 className={cn("bg-gradient-logo bg-clip-text text-xl font-bold text-transparent transition-transform duration-300 ease-in-out", sidebarIsOpen ? "translate-x-0" : "hidden -translate-x-96")}>{APP_NAME}</h1>
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
