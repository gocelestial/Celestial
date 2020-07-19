import { DefaultPageData } from "./DefaultPageData";

interface PostPageData extends DefaultPageData {
	postLink: string;
	syndicationLinks?: string[];
}

export { PostPageData };
