import { DefaultPageData } from "./DefaultPageData";

interface PostPageData extends DefaultPageData {
	formDefaults?: {
		published?: {
			date: string;
			time: string;
		};
	};
	postLink?: string;
	syndicationLinks?: string[];
}

export { PostPageData };
