// Separate storage is required: paths on localhost share origin storage.
export const ENGINE_PREVIEW = typeof __POK_ENGINE_PREVIEW__ !== 'undefined' && __POK_ENGINE_PREVIEW__;
export const STRATEGY_PREVIEW = typeof __POK_STRATEGY_PREVIEW__ !== 'undefined' && __POK_STRATEGY_PREVIEW__;
export const ANDROID = typeof __POK_ANDROID__ !== 'undefined' && __POK_ANDROID__;
export const NOTEBOOK_NAMESPACE=ANDROID?'android':STRATEGY_PREVIEW?'strategy-validation':ENGINE_PREVIEW?'engine-preview':'stable';
