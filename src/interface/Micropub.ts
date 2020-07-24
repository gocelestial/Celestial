interface SyndicationData {
	uid: string;
	name: string;
	service?: {
		name: string;
		url: string;
		photo: string;
	};
	user?: {
		name: string;
		url: string;
		photo: string;
	};
}

interface MicropubConfig extends Object {
	[index: string]: any;
	"media-endpoint"?: string;
	"syndicate-to"?: Array<SyndicationData>;
	categories?: Array<string>;
	"post-types"?: {
		type: string;
		name: string;
	};
}

interface MicropubSyndicationData extends Object {
	[index: string]: any;
	"syndicate-to": Array<SyndicationData>;
}

export { MicropubConfig, MicropubSyndicationData };
