import { mf2 } from "microformats-parser";
import {
	ParsedDocument,
	MicroformatProperty,
	MicroformatRoot,
} from "microformats-parser/dist/types";

// ? We could overload a single function here.

const parseBody = (body: string, baseUrl: string): ParsedDocument => {
	return mf2(body, {
		baseUrl: baseUrl,
	});
};

const parseVocabulary = (
	body: string,
	baseUrl: string,
	vocab: string
): MicroformatRoot | undefined => {
	return parseBody(body, baseUrl).items.find((item) => {
		if (item?.type) return item.type.some((type) => type === vocab);
	});
};

const parseProperty = (
	body: string,
	baseUrl: string,
	vocab: string,
	property: string
): MicroformatProperty[] | undefined => {
	let vocabularies: MicroformatRoot | undefined = parseVocabulary(
		body,
		baseUrl,
		vocab
	);
	if (vocabularies !== undefined) {
		for (const key in vocabularies.properties) {
			if (key === property) return vocabularies.properties[key];
		}
	}
	return;
};

export { parseBody, parseProperty, parseVocabulary };
