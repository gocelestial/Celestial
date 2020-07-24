import { AppUserState } from "../enumerator/AppUserState";
import { MicropubSyndicationData } from "../interface/Micropub";

/**
 * Virtually all pages should need this data at a minimum. If you find there's something hardly being used, move it to its own PageData interface.
 */
interface DefaultPageData {
	title: string;
	subtitle: string;
	appState: AppUserState;
	pageTitle?: string;
	error?: string | null;
}

interface AuthPageData extends DefaultPageData {
	csrfToken?: string;
}

interface UserPageData extends DefaultPageData {
	user: {
		indieauth: {
			identity: string;
		};
		microformats?: {
			name?: string;
			photo?: string;
		};
	};
}

interface PostPageData extends UserPageData {
	formDefaults: {
		published?: {
			date: string;
			time: string;
		};
	};

	// The following is only applicable to publish success pages.
	postLink?: string;
	syndicationLinks?: MicropubSyndicationData;
	"media-endpoint"?: string;
}

export { PostPageData, AuthPageData, UserPageData, DefaultPageData };
