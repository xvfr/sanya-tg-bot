declare module 'node-cron' {
	export function schedule ( string, callback : () => void ) : void
}