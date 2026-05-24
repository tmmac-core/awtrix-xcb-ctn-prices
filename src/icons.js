import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');

const DEFAULT_ICON_FILES = {
  xcb: path.join(projectRoot, 'assets', 'xcb-8.jpg'),
  ctn: path.join(projectRoot, 'assets', 'ctn-8.jpg'),
};

export function loadIcons(env = process.env) {
  return {
    xcb: env.XCB_ICON || loadIconAsBase64(DEFAULT_ICON_FILES.xcb),
    ctn: env.CTN_ICON || loadIconAsBase64(DEFAULT_ICON_FILES.ctn),
  };
}

export function loadIconAsBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64').replace(/\s+/g, '');
}
