import { AppUserState } from "../enumerator/AppUserState";

interface DefaultPageData {
	title: string;
	subtitle: string;
	appState: AppUserState;
	pageTitle?: string;
	csrfToken?: string;
    error?: string | null;
    userIdentity?: {
        me: string
    };
}

export { DefaultPageData };
