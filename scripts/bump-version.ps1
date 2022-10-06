# Get arguments
$versioningType = $args[0] # Posiible arguments are "Major", "Minor", "Build", "Patch"

# Check arguments
if ($null -eq $versioningType -or $versioningType -eq '') {
  $versioningType = 'Patch'
};

# Extract package.json data
$packageData = Get-Content 'package.json' | ConvertFrom-Json
$packageVersion = $packageData.version
$newPackageVersion = $packageData.version

# Increase version number
$packageVersionSplitted = $packageVersion.Split(".")
if ($packageVersionSplitted.Count -eq 3) {

  $majorNumber = $packageVersionSplitted[0]
  $minorNumber = $packageVersionSplitted[1]

  $buildNumber = $packageVersionSplitted[2]
  $newBuildNumber = $buildNumber

  if ($versioningType -eq 'Patch') {
  
    $buildNumberSplitted = $buildNumber.Split("-")
    if ($buildNumberSplitted.Count -eq 1) {

      $newBuildNumber = $buildNumber + '-1'
    }
    elseif ($buildNumberSplitted.Count -eq 2) {

      $newBuildNumber = $buildNumberSplitted[0] + '-' + (++[int]$buildNumberSplitted[1]).ToString()
    }
    else {

      Write-Error 'Can not bump patch version. No valid build version number on package.json found.'
      Exit 666;
    };
  };

  if ($versioningType -eq 'Build') {
  
    $buildNumberSplitted = $buildNumber.Split("-")
    if ($buildNumberSplitted.Count -eq 1) {

      $newBuildNumber = (++[int]$buildNumberSplitted[0]).ToString()
    }
    elseif ($buildNumberSplitted.Count -eq 2) {

      # We clear the patch number at this point
      $newBuildNumber = (++[int]$buildNumberSplitted[0]).ToString() # + '-' + $buildNumberSplitted[1]
    }
    else {

      Write-Error 'Can not bump build version. No valid build version number on package.json found.'
      Exit 666;
    };
  };

  # Setup new version
  $newPackageVersion = $packageVersionSplitted[0] + '.' + $packageVersionSplitted[1] + '.' + $newBuildNumber
}
else {

  Write-Error 'Can not bump version. No valid version number on package.json found.'
  Exit 666;
};

# Check for version bump
if ($newPackageVersion -ne $packageVersion) {
  Write-Host "Bump version from [v$($packageVersion)] to [v$($newPackageVersion)]"
  npm version $newPackageVersion --git-tag-version=false
};
