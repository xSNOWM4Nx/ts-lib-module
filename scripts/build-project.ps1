# Prepare proper work space
Remove-Item 'build' -Recurse -ErrorAction SilentlyContinue
Remove-Item '*.tgz'

# Extract package.json data
$packageData = Get-Content 'package.json' | ConvertFrom-Json
$packageVersion = $packageData.version

Write-Host "Build project [v$($packageVersion)]"

# Build project
npm run compile

# Already included in "compile" script
# Copy-Item -Path src\styles -Destination build\src -Recurse

# Currently not required
# npm pack