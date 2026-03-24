import {
	BriefcaseBusiness,
	Building2,
	CircleDot,
	CircleHelp,
	CircleUserRound,
	ClipboardPenLine,
	Clock,
	Cog,
	Contact,
	FileCheck,
	Gem,
	LandPlot,
	LayoutDashboard,
	NotebookPen,
	Package,
	RefreshCw,
	Route,
	Ruler,
	SlidersHorizontal,
	UserCheck,
	UserRoundCheck,
	UsersRound,
	Waypoints,
	Wrench,
	XCircle,
} from "lucide-react";

type MenuIconProps = {
	icon: string;
};

const MenuIcon = ({ icon }: MenuIconProps) => {
	switch (icon) {
		case "layout-dashboard":
			return <LayoutDashboard />;
		case "users":
			return <UserRoundCheck />;
		case "business":
			return <BriefcaseBusiness />;
		case "UsersRound":
			return <UsersRound />;
		case "clipboard-pen-line":
			return <ClipboardPenLine />;
		case "NotebookPen":
			return <NotebookPen />;
		case "package":
			return <Package />;
		case "Cog":
			return <Cog />;
		case "SlidersHorizontal":
			return <SlidersHorizontal />;
		case "Contact":
			return <Contact />;
		case "LandPlot":
			return <LandPlot />;
		case "waypoints":
			return <Waypoints />;
		case "Settings":
			return <Wrench />;
		case "User":
			return <CircleUserRound />;
		case "building":
			return <Building2 />;
		case "badge":
			return <UserCheck />;
		case "route":
			return <Route />;
		case "circle-help":
			return <CircleHelp />;
		case "Clock":
			return <Clock />;
		case "FileCheck":
			return <FileCheck />;
		case "RefreshCw":
			return <RefreshCw />;
		case "XCircle":
			return <XCircle />;
		case "Gem":
			return <Gem />;
		case "Ruler":
			return <Ruler />;
		default:
			return <CircleDot />;
	}
};

export default MenuIcon;
