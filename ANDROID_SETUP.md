# Android App Setup with Capacitor

This project can be wrapped as a native Android app using Capacitor.

## Prerequisites
- Node.js 18+
- Android Studio
- Java JDK

## Steps
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure for static export (already updated in next.config.ts):
   Build with:
   ```bash
   npm run build
   ```
   This generates the `out/` directory.

3. Add Android platform:
   ```bash
   npx cap add android
   ```

4. Sync:
   ```bash
   npx cap sync android
   ```

5. Open in Android Studio:
   ```bash
   npx cap open android
   ```

6. Build and run on device/emulator.

## Notes
- For production, update appId in capacitor.config.ts if needed.
- Native features can be added via Capacitor plugins later.
- Do not commit the full android/ if generated locally; or commit after sync for consistency.
