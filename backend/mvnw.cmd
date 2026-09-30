@echo off
setlocal
set MAVEN_HOME=%~dp0mvnw-dl\apache-maven-3.9.9
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
  echo [mvnw] Maven distribution not found at "%MAVEN_HOME%"
  exit /b 1
)
call "%MAVEN_HOME%\bin\mvn.cmd" %*
endlocal
