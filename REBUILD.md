# Recommended Rebuild for Android (beyond Capacitor wrapper)

Capacitor provides a quick path to Play Store by wrapping the existing Next.js web app. For a high-quality native experience, consider the following rebuild:

## Why Native?
- Better performance, offline capability, and UX polish
- Deep integration with Android (Share Intent from other apps, notifications, MediaStore)
- Privacy: process on-device instead of remote worker

## Proposed Stack
- **Language/UI**: Kotlin + Jetpack Compose + Material 3
- **Architecture**: MVVM / UDF with ViewModel + StateFlow
- **Downloads**: WorkManager + DownloadManager + MediaStore (no storage permission on Android 10+)
- **Media extraction**: Embed yt-dlp via youtubedl-android or Chaquopy (on-device) for privacy and offline. Fallback to remote API if needed.
- **Playback**: Media3 / ExoPlayer
- **Share**: Intent filter for ACTION_SEND to receive URLs from SNS apps

## Open-source references
- ClipSave, MediaGrab, ytdlnis (yt-dlp based native downloaders)

## Migration path
1. Keep Capacitor for quick release.
2. Gradually extract business logic.
3. Rebuild UI and download pipeline natively.

This approach yields a more reliable, private, and Android-native media saver.
