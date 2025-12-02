package com.autodetectorapp

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat

class OverlayService : Service() {
  private lateinit var windowManager: WindowManager
  private var overlayView: View? = null

  companion object {
    private const val CHANNEL_ID = "overlay_service_channel"
    private const val OVERLAY_NOTIFICATION_ID = 9955
    private const val EXTRA_MESSAGE = "EXTRA_OVERLAY_MESSAGE"
    private const val EXTRA_PACKAGE = "EXTRA_OVERLAY_PACKAGE"

    fun startOverlay(context: Context, keyword: String, packageName: String) {
      val intent = Intent(context, OverlayService::class.java).apply {
        putExtra(EXTRA_MESSAGE, "พบ keyword: $keyword")
        putExtra(EXTRA_PACKAGE, packageName)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val message = intent?.getStringExtra(EXTRA_MESSAGE) ?: "พบ keyword ที่คุณกำหนด"
    val targetPackage = intent?.getStringExtra(EXTRA_PACKAGE) ?: ""
    showOverlay(message, targetPackage)
    createChannelIfNeeded()
    val notification = buildForegroundNotification(message)
    startForeground(OVERLAY_NOTIFICATION_ID, notification)
    return START_STICKY
  }

  private fun showOverlay(message: String, targetPackage: String) {
    overlayView?.let {
      windowManager.removeViewImmediate(it)
    }

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      else
        WindowManager.LayoutParams.TYPE_PHONE,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    )

    val layout = LayoutInflater.from(this).inflate(R.layout.overlay_view, null)
    layout.findViewById<TextView>(R.id.overlayMessage).text = message
    layout.findViewById<Button>(R.id.overlayButton).setOnClickListener {
      if (targetPackage.isNotBlank()) {
        NavigationHelper.openApp(this, targetPackage)
      }
    }

    overlayView = layout
    windowManager.addView(layout, params)
  }

  private fun createChannelIfNeeded() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = getSystemService(NotificationManager::class.java)
    manager?.let {
      if (it.getNotificationChannel(CHANNEL_ID) == null) {
        val channel = NotificationChannel(
          CHANNEL_ID,
          getString(R.string.accessibility_service_label),
          NotificationManager.IMPORTANCE_HIGH,
        ).apply {
          description = "Overlay notification channel"
        }
        it.createNotificationChannel(channel)
      }
    }
  }

  private fun buildForegroundNotification(message: String): Notification {
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(message)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setOngoing(true)
      .build()
  }

  override fun onDestroy() {
    overlayView?.let { windowManager.removeViewImmediate(it) }
    overlayView = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null
}
