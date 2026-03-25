type Staff = {
	_id: string;
	userName: string;
	email: string;
	firstName: string;
	middleName?: string;
	lastName: string;
	phoneNumber?: string;
	role: "ROLE_OWNER" | "ROLE_ADMIN" | "ROLE_OFFICE_STAFF" | "ROLE_FIELD_STAFF";
	createdAt: string;
	updatedAt: string;
};
