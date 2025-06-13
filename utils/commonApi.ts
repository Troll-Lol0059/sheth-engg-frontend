import axios from "@config/axios";
import { handleAxiosError } from "./errorHandling";

export const getAllCountries = async () => {
	try {
		const response = await axios.get("/user-management/api/common/public/countries");
		return response?.data as Country[];
	} catch (error: unknown) {
		return handleAxiosError<Country>(error);
	}
};
