import { ReactNode } from "react";
import Sidebar from "@components/common/sidebar";
import Navbar from "@components/common/navbar";

const PrivateLayout = async ({ children }: Readonly<{ children: ReactNode }>) => {
	const menuItems: MenuItem[] = [
		{
			uuid: "1",
			name: "RFQ",
			src: "/RFQ",
			icon: "clipboard-pen-line",
			allowedRoles: [],
		},
		{
			uuid: "2",
			name: "Master",
			src: "/master",
			icon: "SlidersHorizontal",
			submenus: [
				{
					uuid: "2-1",
					name: "Raw Material Types",
					src: "/master/raw-material-types",
					icon: "package",
				},
				{
					uuid: "2-2",
					name: "Labour Process Types",
					src: "/master/labour-process-types",
					icon: "Cog",
				},
			],
			allowedRoles: [],
		},
		{
			uuid: "3",
			name: "Party Master",
			src: "/party",
			icon: "Contact",
			allowedRoles: [],
		},
	];

	return (
		<div className="flex min-h-screen w-full flex-row justify-between">
			{/* Desktop Sidebar */}
			<aside className="hidden lg:block">
				<Sidebar menuItems={menuItems} />
			</aside>
			{/* Main Content */}
			<main className="flex flex-1 flex-col overflow-hidden">
				<Navbar menuItemsData={menuItems} sessionData={{ uuid: null, avatarUrl: null, name: null, email: null, contactNo: null, roles: [] }} />
				<div className="flex-1 overflow-auto">{children}</div>
			</main>
		</div>
	);
};

export default PrivateLayout;

