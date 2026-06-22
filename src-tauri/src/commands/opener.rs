use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::Command;

#[tauri::command]
pub async fn open_containing_folder(path: String) -> Result<(), String> {
    if path.trim().is_empty() {
        return Err("文件路径不能为空".to_string());
    }

    let path = PathBuf::from(path);
    tauri::async_runtime::spawn_blocking(move || reveal_path(&path))
        .await
        .map_err(|e| format!("打开所在位置失败: {}", e))?
}

/// 将 md++ 注册为 .md / .markdown 文件的默认打开方式
#[tauri::command]
pub async fn register_file_association() -> Result<(), String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("获取程序路径失败: {}", e))?;
    let exe_str = exe_path.to_string_lossy().to_string();

    let commands = [
        // 右键菜单"用 md++ 打开"
        (r"HKCU\Software\Classes\.md\shell\OpenWithMdpp", "/ve", "用 md++ 打开"),
        (r"HKCU\Software\Classes\.md\shell\OpenWithMdpp\command", "/ve", &format!("\"{}\" \"%1\"", exe_str)),
        (r"HKCU\Software\Classes\.markdown\shell\OpenWithMdpp", "/ve", "用 md++ 打开"),
        (r"HKCU\Software\Classes\.markdown\shell\OpenWithMdpp\command", "/ve", &format!("\"{}\" \"%1\"", exe_str)),
        // 默认打开方式
        (r"HKCU\Software\Classes\.md", "/ve", "MdppMarkdown"),
        (r"HKCU\Software\Classes\MdppMarkdown", "/ve", "Markdown 文件"),
        (r"HKCU\Software\Classes\MdppMarkdown\DefaultIcon", "/ve", &format!("\"{}\",0", exe_str)),
        (r"HKCU\Software\Classes\MdppMarkdown\shell\open\command", "/ve", &format!("\"{}\" \"%1\"", exe_str)),
        (r"HKCU\Software\Classes\.markdown", "/ve", "MdppMarkdown"),
    ];

    for (key, value_name, data) in &commands {
        let mut cmd = Command::new("reg");
        cmd.arg("add").arg(key);
        if *value_name == "/ve" {
            cmd.arg("/ve");
        } else {
            cmd.arg("/v").arg(value_name);
        }
        cmd.arg("/d").arg(data)
           .arg("/f");
        let output = cmd.output().map_err(|e| format!("执行注册表命令失败: {}", e))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("注册表写入失败: {}", stderr));
        }
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn reveal_path(path: &Path) -> Result<(), String> {
    let mut select_arg = OsString::from("/select,");
    select_arg.push(path.as_os_str());
    Command::new("explorer.exe")
        .arg(select_arg)
        .spawn()
        .map_err(|e| format!("启动资源管理器失败: {}", e))?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn reveal_path(path: &Path) -> Result<(), String> {
    Command::new("open")
        .arg("-R")
        .arg(path)
        .spawn()
        .map_err(|e| format!("启动 Finder 失败: {}", e))?;
    Ok(())
}

#[cfg(all(unix, not(target_os = "macos")))]
fn reveal_path(path: &Path) -> Result<(), String> {
    let target = path.parent().unwrap_or(path);
    Command::new("xdg-open")
        .arg(target)
        .spawn()
        .map_err(|e| format!("启动文件管理器失败: {}", e))?;
    Ok(())
}
