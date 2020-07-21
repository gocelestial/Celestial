import { AppUserState } from "../enumerator/AppUserState";

interface DefaultPageData {
	title: string;
	subtitle: string;
	appState: AppUserState;
	pageTitle?: string;
	csrfToken?: string;
	error?: string | null;
	// TODO Phase out userIdentity and merge with user below
	userIdentity?: {
		me: string;
	};
	user?: {
		microformats?: {
			name?: string;
			photo?: string;
		};
	};
}

export { DefaultPageData };
