declare class log {
	constructor( file: string );
	static TimeStamp: string;
	static toString( $v: { [x: string]: unknown; } ): string;
	add( $messages: { [x: string]: unknown; } | string ): void;
	error( $message: unknown ): void;
}

export = log;
