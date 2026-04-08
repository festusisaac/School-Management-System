/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_UPLOAD_URL?: string;
    readonly VITE_API_URL?: string;
    readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
    readonly VITE_FLUTTERWAVE_PUBLIC_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
