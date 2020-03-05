What is ts-lib-module?
===
It's an open-source project written in TypeScript.

This project represents my standard library for generic type definitions and patterns that I use in various other projects. It can be obtained from [npm](https://www.npmjs.com/~daniel.neuweiler) or distributed as a development package with the scripts.

[![Code Style: Google](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)

## Packages 📦:
- gts
- typescript

## Features 🔮:
- Types: Type definitions for various applications (REST, I18n, etc.)
- Service injection: Inject a service (REST, Notification etc.) whenever it is needed
- Logging: Create a log unit and archive the logs

## Dev-Deploy ⌨️:
- Use the "npm run devcompile" script to deploy the package to the other cloned repositories.
- The package is then stored under "*/node_modules/@mymodules/ts-lib-module" on the cloned target repositories.

## License 📑:
- MIT © [xSNOWM4Nx](https://github.com/xSNOWM4Nx)
---
This project was bootstrapped with [gts](https://github.com/google/gts).
