import { AxiosError } from "axios";

interface PaginatedErrorResponse<T> {
	content: T[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

export const handleAxiosError = <T>(error: unknown): T[] => {
	const errorData = (error as AxiosError)?.response?.data as ErrorData;
	console.error(errorData?.message || (error as AxiosError)?.response?.statusText);
	return [] as T[];
};

export const handleObjectAxiosError = <T>(error: unknown): T => {
	const errorData = (error as AxiosError)?.response?.data as ErrorData;
	console.error(errorData?.message || (error as AxiosError)?.response?.statusText);
	return {} as T;
};

export const handlePaginatedAxiosError = <T>(error: unknown): PaginatedErrorResponse<T> => {
	const errorData = (error as AxiosError)?.response?.data as ErrorData;
	console.error(errorData?.message || (error as AxiosError)?.response?.statusText);
	return {
		content: [] as T[],
		number: 0,
		size: 0,
		totalElements: 0,
		totalPages: 0,
	};
};
