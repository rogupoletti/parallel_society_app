---
description: Build Android APK
---
1. Fix file permissions to avoid build errors
// turbo
attrib -R * /S /D

2. Run EAS Build
npx eas-cli build -p android --profile preview --non-interactive
