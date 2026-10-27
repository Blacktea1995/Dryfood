/**
 * Shared media helper: stable Wikimedia Commons photograph URLs.
 * Kept in one place so every section uses the same real-image source.
 */

export function commonsUrl(file, w = 640) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
}