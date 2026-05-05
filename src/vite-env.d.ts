/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_API_PREFERRED?: 'local' | 'official' | string;
	readonly VITE_LOCAL_HOST?: string;
	readonly VITE_LOCAL_DEFAULT_PORT?: string;
	readonly VITE_API_1_BASE: string;
	readonly VITE_API_2_BASE: string;
	readonly VITE_API_3_BASE: string;
	readonly VITE_LOCAL_GATEWAY_BASE?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
