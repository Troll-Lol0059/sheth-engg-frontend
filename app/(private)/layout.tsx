import { ReactNode } from "react";
import Sidebar from "@components/common/sidebar";
import Navbar from "@components/common/navbar";
import { menuItems } from "@data";

const PrivateLayout = async ({ children }: Readonly<{ children: ReactNode }>) => {
	return (
		<div className="flex min-h-screen w-full flex-row justify-between">
			{/* Desktop Sidebar */}
			<aside className="hidden lg:block">
				<Sidebar menuItems={menuItems} />
			</aside>
			{/* Main Content */}
			<main className="flex flex-1 flex-col overflow-hidden">
				<Navbar menuItemsData={menuItems} />
				<div className="flex-1 overflow-auto">{children}</div>
			</main>
		</div>
	);
};

export default PrivateLayout;
