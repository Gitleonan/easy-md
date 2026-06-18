use std::fs;
use std::path::{Path, PathBuf};
use base64::{engine::general_purpose, Engine as _};

/// 读取文件文本内容
#[tauri::command]
pub async fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败: {}", e))
}

/// 解析图片：网络地址原样返回，本地路径读为 data URL；失败返回占位符
#[tauri::command]
pub async fn resolve_image(md_file_path: String, src: String) -> Result<String, String> {
    if src.starts_with("http://") || src.starts_with("https://") {
        return Ok(src);
    }
    let img_path = resolve_local_path(&md_file_path, &src);
    match fs::read(&img_path) {
        Ok(bytes) => {
            let mime = guess_mime(&img_path);
            let b64 = general_purpose::STANDARD.encode(&bytes);
            Ok(format!("data:{};base64,{}", mime, b64))
        }
        Err(_) => Ok(PLACEHOLDER_DATA_URL.to_string()),
    }
}

/// 解析相对路径（以 MD 文件所在目录为基准）或绝对路径
pub fn resolve_local_path(md_file_path: &str, src: &str) -> PathBuf {
    let p = Path::new(src);
    if p.is_absolute() {
        PathBuf::from(src)
    } else {
        Path::new(md_file_path)
            .parent()
            .unwrap_or(Path::new("."))
            .join(src)
    }
}

/// 根据文件扩展名猜测 MIME 类型
pub fn guess_mime(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()) {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("bmp") => "image/bmp",
        Some("ico") => "image/x-icon",
        _ => "application/octet-stream",
    }
}

/// 图片不存在时的占位符 data URL（SVG，显示"图片未找到"）
const PLACEHOLDER_DATA_URL: &str = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjAwIDEyMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIxMDAiIHk9IjYwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8k+aqOa4heeUqOaIt1xyXG7lm77niYc8L3RleHQ+PC9zdmc+";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_relative_path_against_md_dir() {
        let p = resolve_local_path("/docs/note.md", "./img/a.png");
        assert_eq!(p, PathBuf::from("/docs/./img/a.png"));
    }

    #[test]
    fn resolves_absolute_path_as_is() {
        let p = resolve_local_path("/docs/note.md", "/abs/img/a.png");
        assert_eq!(p, PathBuf::from("/abs/img/a.png"));
    }

    #[test]
    fn guesses_mime_for_common_extensions() {
        assert_eq!(guess_mime(Path::new("a.png")), "image/png");
        assert_eq!(guess_mime(Path::new("a.JPG")), "image/jpeg");
        assert_eq!(guess_mime(Path::new("a.svg")), "image/svg+xml");
        assert_eq!(guess_mime(Path::new("a.xyz")), "application/octet-stream");
    }
}
