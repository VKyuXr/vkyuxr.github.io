使用以下 PowerShell 指令清理当前文件夹下的所有相同文件。

```PowerShell
Get-ChildItem *.* -recurse
	| Get-Filehash 
	| Group-Object -property hash 
	| Where-Object { $_.count -gt 1 } 
	| %{ $_.group 
	| select -skip 1 } 
	| Remove-Item
```
