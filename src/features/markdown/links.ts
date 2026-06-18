/** 链接分类与路径解析工具 */

export type LinkKind =
  | { kind: 'anchor'; hash: string }
  | { kind: 'external'; url: string }
  | { kind: 'mdFile'; path: string; hash: string }
  | { kind: 'localFile'; path: string }
  | { kind: 'unknown' };

const EXTERNAL_PROTO = /^(https?|ftp|mailto|tel):/i;
const MD_EXT = /\.(md|markdown)$/i;
const ABS_PATH = /^([a-zA-Z]:[\\/]|[\\/])/;

/** 把 markdown 链接 href 归一化分类。href 应该是 markdown-it 渲染后的原始字符串。 */
export function classifyLink(href: string): LinkKind {
  if (!href) return { kind: 'unknown' };
  if (href.startsWith('#')) return { kind: 'anchor', hash: href.slice(1) };
  if (EXTERNAL_PROTO.test(href)) return { kind: 'external', url: href };

  // 本地路径或相对路径，先把 URL 编码解开
  let raw: string;
  try { raw = decodeURI(href); } catch { raw = href; }

  // 拆掉 hash 与 query
  const hashIdx = raw.indexOf('#');
  let pathPart = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw;
  const hash = hashIdx >= 0 ? raw.slice(hashIdx + 1) : '';
  const queryIdx = pathPart.indexOf('?');
  if (queryIdx >= 0) pathPart = pathPart.slice(0, queryIdx);

  if (!pathPart) return { kind: 'anchor', hash };
  if (MD_EXT.test(pathPart)) return { kind: 'mdFile', path: pathPart, hash };
  return { kind: 'localFile', path: pathPart };
}

/**
 * 把 markdown 文件中相对/绝对的链接路径解析为完整文件系统路径。
 * - basePath 用当前打开 md 文件的绝对路径（带文件名）。
 * - href 已经是 decodeURI 后的字符串。
 * - 输出沿用 basePath 的分隔符习惯（Windows 用 `\`，类 UNIX 用 `/`）。
 */
export function resolveLocalPath(basePath: string, href: string): string {
  if (ABS_PATH.test(href)) return normalizeSeparator(href, detectSep(basePath));

  const sep = detectSep(basePath);
  const dir = basePath.replace(/[\\/][^\\/]*$/, '');
  const normalizedHref = href.replace(/[\\/]+/g, sep);

  const combined = dir.length > 0 ? `${dir}${sep}${normalizedHref}` : normalizedHref;
  const segments = combined.split(sep);
  const result: string[] = [];
  for (const seg of segments) {
    if (seg === '..') {
      // 保留盘符或根分隔符
      if (result.length > 1 || (result.length === 1 && result[0] === '')) {
        result.pop();
      } else {
        result.push(seg);
      }
    } else if (seg === '.') {
      // skip
    } else {
      result.push(seg);
    }
  }
  return result.join(sep);
}

function detectSep(p: string): '\\' | '/' {
  if (p.includes('\\')) return '\\';
  if (p.includes('/')) return '/';
  return '\\';
}

function normalizeSeparator(p: string, sep: '\\' | '/'): string {
  return p.replace(/[\\/]+/g, sep);
}
