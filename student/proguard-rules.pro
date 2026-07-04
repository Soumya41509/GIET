# Add project-specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in node_modules\react-native\android\app\proguard-rules.pro

# --- React Native Reanimated ---
-keep class com.swmansion.reanimated.** { *; }
-keep interface com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# --- Expo Modules ---
-keep class expo.modules.** { *; }
-keep interface expo.modules.** { *; }

# --- Supabase / OkHttp / Serialization ---
-keep class com.google.gson.** { *; }
-keep class com.fasterxml.jackson.** { *; }
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# --- Android NetInfo ---
-keep class com.reactnativecommunity.netinfo.** { *; }

# --- AsyncStorage ---
-keep class com.reactnativecommunity.asyncstorage.** { *; }
