package com.autodetectorapp

import android.content.Context
import android.graphics.Rect
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.modules.core.DeviceEventManagerModule

private const val EVENT_SCREEN_TEXT = "ScreenTextDetected"

class DetectorModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  init {
    DetectorState.reactContext = reactContext
    DetectorState.nativeContext = reactContext.applicationContext
  }

  override fun getName(): String = "DetectorModule"

  @ReactMethod
  fun updateKeywords(keywords: ReadableArray) {
    val parsed = keywordsToList(keywords)
    DetectorState.updateKeywords(parsed)
    Log.d("DetectorModule", "Keywords updated: $parsed")
  }

  @ReactMethod
  fun updateZone(minX: Int, maxX: Int, minY: Int, maxY: Int) {
    DetectorState.updateZone(minX, maxX, minY, maxY)
    Log.d("DetectorModule", "Zone updated: [$minX,$minY]-[$maxX,$maxY]")
  }

  @ReactMethod
  fun updateWhitelist(packages: ReadableArray) {
    val parsed = keywordsToList(packages)
    DetectorState.updateWhitelist(parsed)
    Log.d("DetectorModule", "Whitelist updated: $parsed")
  }

  @ReactMethod
  fun openApp(packageName: String) {
    if (packageName.isBlank()) {
      return
    }
    NavigationHelper.openApp(reactContext, packageName)
  }

  private fun keywordsToList(array: ReadableArray?): List<String> {
    val entries = mutableListOf<String>()
    array?.let {
      for (index in 0 until it.size()) {
        it.getString(index)?.takeIf { value -> value.isNotBlank() }?.let(entries::add)
      }
    }
    return entries
  }
}

object DetectorState {
  var reactContext: ReactApplicationContext? = null
  var nativeContext: Context? = null

  private val keywords = mutableSetOf<String>()
  private var whitelist: Set<String>? = null
  private val zoneRect = Rect(0, 0, Int.MAX_VALUE, Int.MAX_VALUE)

  fun updateKeywords(list: List<String>) {
    keywords.clear()
    keywords.addAll(list.map { it.lowercase() })
  }

  fun updateWhitelist(list: List<String>) {
    whitelist = list.map { it.lowercase() }.toSet().takeIf { it.isNotEmpty() }
  }

  fun updateZone(minX: Int, maxX: Int, minY: Int, maxY: Int) {
    zoneRect.set(minX, minY, maxX, maxY)
  }

  fun findKeyword(text: String): String? {
    val normalized = text.lowercase()
    return keywords.firstOrNull { normalized.contains(it) }
  }

  fun matchesZone(bounds: Rect): Boolean {
    return Rect.intersects(zoneRect, bounds)
  }

  fun isPackageAllowed(packageName: String): Boolean {
    val normalized = packageName.lowercase()
    return whitelist?.contains(normalized) ?: true
  }

  fun emitDetection(
    context: Context,
    packageName: String,
    keyword: String,
    detectedText: String,
    bounds: Rect,
  ) {
    emitToReactNative(packageName, detectedText, keyword, bounds)
    nativeContext?.let { appContext ->
      AlertHelper.triggerAlert(appContext, keyword, packageName)
      OverlayService.startOverlay(appContext, keyword, packageName)
    }
    Log.d(
      "DetectorState",
      "Detected keyword=\"$keyword\" in $packageName with text=\"$detectedText\"",
    )
  }

  private fun emitToReactNative(
    packageName: String,
    detectedText: String,
    keyword: String,
    bounds: Rect,
  ) {
    val emitter = reactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    if (emitter == null) {
      return
    }

    val payload = Arguments.createMap().apply {
      putString("packageName", packageName)
      putString("text", detectedText)
      putString("keyword", keyword)
      putMap("bounds",
        Arguments.createMap().apply {
          putInt("left", bounds.left)
          putInt("top", bounds.top)
          putInt("right", bounds.right)
          putInt("bottom", bounds.bottom)
        },
      )
    }
    emitter.emit(EVENT_SCREEN_TEXT, payload)
  }
}
