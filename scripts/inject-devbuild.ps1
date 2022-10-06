# Bump patch version of the package
& "$PSScriptRoot\bump-version.ps1" 'Patch'

# Build package
& "$PSScriptRoot\build-project.ps1"

# Iterate over the dependent projects and replace the existing node module content
Get-Content .env.dependentprojects | ForEach-Object {

  $name, $value = $_.split('=')
  Copy-Item -Path build -Destination $value -Recurse -Force
  Copy-Item -Path package.json -Destination $value -Recurse -Force
};
