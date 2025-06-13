import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthSessionStore = {
	session: AuthSession | null;
	setSession: (session: AuthSession | null) => void;
};

const useSession = create<AuthSessionStore>()(
	persist(
		set => ({
			session: null,
			setSession: (session: AuthSession | null) => set({ session }),
		}),
		{ name: "AuthSession" }
	)
);

export default useSession;
