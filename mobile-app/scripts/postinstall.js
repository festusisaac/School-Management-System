/**
 * Postinstall script to patch React Native's Event.js
 * 
 * React Native 0.85+ declares Flow-typed class fields (NONE, CAPTURING_PHASE, etc.)
 * on the Event class. When Babel compiles these with loose mode class-properties
 * (needed for WatermelonDB), it generates `this.NONE = void 0` which overwrites
 * the read-only property set by Object.defineProperty later in the file.
 * 
 * This patch removes those Flow declarations so Babel doesn't generate the
 * conflicting assignments.
 */
const fs = require('fs');
const path = require('path');

const eventJsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'src',
  'private',
  'webapis',
  'dom',
  'events',
  'Event.js'
);

if (fs.existsSync(eventJsPath)) {
  let content = fs.readFileSync(eventJsPath, 'utf8');
  const original = content;

  // Remove static Flow field declarations like:  static +NONE: 0;
  content = content.replace(/^\s*static \+NONE: 0;\s*\n/m, '');
  content = content.replace(/^\s*static \+CAPTURING_PHASE: 1;\s*\n/m, '');
  content = content.replace(/^\s*static \+AT_TARGET: 2;\s*\n/m, '');
  content = content.replace(/^\s*static \+BUBBLING_PHASE: 3;\s*\n/m, '');

  // Remove instance Flow field declarations like:  +NONE: 0;
  content = content.replace(/^\s*\+NONE: 0;\s*\n/m, '');
  content = content.replace(/^\s*\+CAPTURING_PHASE: 1;\s*\n/m, '');
  content = content.replace(/^\s*\+AT_TARGET: 2;\s*\n/m, '');
  content = content.replace(/^\s*\+BUBBLING_PHASE: 3;\s*\n/m, '');

  if (content !== original) {
    fs.writeFileSync(eventJsPath, content);
    console.log('[postinstall] Patched React Native Event.js (removed read-only field declarations)');
  } else {
    console.log('[postinstall] React Native Event.js already patched or structure changed');
  }
} else {
  console.log('[postinstall] React Native Event.js not found — skipping patch');
}
