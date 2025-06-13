import parsePhoneNumber from "libphonenumber-js";
export const isValidNumber = (number: string) => {
	const phoneNumber = parsePhoneNumber(number);
	return phoneNumber && phoneNumber.isValid();
};
