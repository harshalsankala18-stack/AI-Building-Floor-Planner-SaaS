// Browser stub for server-only Node compilation modules
export default {};
export const compile = () => ({ errors: [], scene: {}, svg: '', ast: { body: [] } });
export const describe = () => ({ ok: true, rooms: [], doors: [], windows: [], verticals: [] });
export const lint = () => [];
export const validateIntent = () => ({ ok: true });
export const toDxf = () => '';
export const toPdf = () => new Uint8Array();
export const renderPngFromSvg = () => new Uint8Array();
export const renderPng = () => new Uint8Array();
