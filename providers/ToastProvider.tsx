"use client";
import { ReactNode } from "react";
import { Toaster } from "@components/ui/toaster";

type ToastProps = {
	children: ReactNode;
};

const ToastProvider = ({ children }: ToastProps) => {
	return (
		<>
			{children}
			<Toaster />
		</>
	);
};

export default ToastProvider;
