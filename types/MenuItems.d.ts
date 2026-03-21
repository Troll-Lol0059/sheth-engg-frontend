type SubMenuItem = {
	uuid: string;
	name: string;
	src: string;
	icon: string;
};

type MenuItem = {
	uuid: string;
	name: string;
	src: string;
	icon: string;
	submenus?: SubMenuItem[];
	allowedRoles: string[];
};
