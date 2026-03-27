import Image from "next/image";
import { logo } from "@assets";

export default function Home() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<Image alt="Sheth Engineering" src={logo} width={200} height={52} priority />
		</div>
	);
}
