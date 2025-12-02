package com.autodetectorapp

import android.content.Context
import android.content.Intent

object NavigationHelper {
  fun openApp(context: Context, packageName: String) {
    val manager = context.packageManager
    val launchIntent = manager.getLaunchIntentForPackage(packageName)
    val intent = launchIntent ?: Intent(Intent.ACTION_MAIN).apply {
      addCategory(Intent.CATEGORY_LAUNCHER)
      setPackage(packageName)
    }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    if (intent.resolveActivity(manager) != null) {
      context.startActivity(intent)
    }
  }
}
