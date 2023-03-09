set NODE_PATH=%SPLUNK_HOME%\lib\smc\node_modules
set NODE_OPTIONS=--max_old_space_size=2048
if exist %SPLUNK_HOME%\bin\node.exe (
    %SPLUNK_HOME%\bin\node.exe %* 
) else (
    %SPLUNK_HOME%\x86\bin\node.exe %* 
)
