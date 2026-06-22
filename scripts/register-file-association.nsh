!macro NSIS_HOOK_POSTINSTALL
  ; 注册 .md 文件右键菜单"用 md++ 打开"
  WriteRegStr HKCU "Software\Classes\.md\shell\OpenWithMdpp" "" "用 md++ 打开"
  WriteRegStr HKCU "Software\Classes\.md\shell\OpenWithMdpp\command" "" '"$INSTDIR\md++.exe" "%1"'
  ; .markdown 同理
  WriteRegStr HKCU "Software\Classes\.markdown\shell\OpenWithMdpp" "" "用 md++ 打开"
  WriteRegStr HKCU "Software\Classes\.markdown\shell\OpenWithMdpp\command" "" '"$INSTDIR\md++.exe" "%1"'
  ; 注册为默认打开方式
  WriteRegStr HKCU "Software\Classes\.md" "" "MdppMarkdown"
  WriteRegStr HKCU "Software\Classes\MdppMarkdown" "" "Markdown 文件"
  WriteRegStr HKCU "Software\Classes\MdppMarkdown\DefaultIcon" "" '"$INSTDIR\md++.exe",0'
  WriteRegStr HKCU "Software\Classes\MdppMarkdown\shell\open\command" "" '"$INSTDIR\md++.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\.markdown" "" "MdppMarkdown"
  ; 通知系统刷新文件关联
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0x1000, i 0, i 0)'
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; 卸载时清理注册表
  DeleteRegKey HKCU "Software\Classes\.md\shell\OpenWithMdpp"
  DeleteRegKey HKCU "Software\Classes\.markdown\shell\OpenWithMdpp"
  DeleteRegKey HKCU "Software\Classes\MdppMarkdown"
  ; 只清理我们设置的默认值，不删除 .md 和 .markdown 的其他关联
  ; 通知系统刷新
  System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0x1000, i 0, i 0)'
!macroend
