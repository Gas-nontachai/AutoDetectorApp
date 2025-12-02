package com.autodetectorapp

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.graphics.Rect
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class MyDetectorService : AccessibilityService() {
  private val logTag = "MyDetectorService"

  override fun onServiceConnected() {
    super.onServiceConnected()
    DetectorState.nativeContext = applicationContext

    val info = AccessibilityServiceInfo().apply {
      eventTypes =
        AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
      feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
      flags =
        AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
          AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
      notificationTimeout = 150
    }

    serviceInfo = info
    Log.d(logTag, "Accessibility service connected and ready")
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) {
      return
    }

    val packageName = event.packageName?.toString() ?: return
    if (!DetectorState.isPackageAllowed(packageName)) {
      // Early return when whitelist is configured and the package is not inside.
      return
    }

    val root = rootInActiveWindow ?: return
    traverseNode(root, packageName)
    root.recycle()
  }

  private fun traverseNode(node: AccessibilityNodeInfo?, packageName: String) {
    if (node == null) {
      return
    }

    val text = node.text?.toString()?.trim()
      ?: node.contentDescription?.toString()?.trim()
    val bounds = Rect()
    node.getBoundsInScreen(bounds)

    if (!bounds.isEmpty && DetectorState.matchesZone(bounds)) {
      val matchedKeyword = text?.let { DetectorState.findKeyword(it) }
      if (!matchedKeyword.isNullOrEmpty()) {
        DetectorState.emitDetection(this, packageName, matchedKeyword, text, bounds)
      }
    }

    for (index in 0 until node.childCount) {
      val child = node.getChild(index)
      traverseNode(child, packageName)
      child?.recycle()
    }
  }

  override fun onInterrupt() {}
}
