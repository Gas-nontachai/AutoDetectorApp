package com.autodetectorapp

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object AlertHelper {
  private const val CHANNEL_ID = "detector_alert_channel"
  private const val CHANNEL_NAME = "Screen Text Detector"
  private const val NOTIFICATION_ID = 5050

  fun triggerAlert(context: Context, keyword: String, packageName: String) {
    createChannel(context)

    val soundUri = try {
      // Replace the demo raw file with an actual custom sound file when available.
      Uri.parse("android.resource://${context.packageName}/raw/custom_alert")
    } catch (exception: Exception) {
      RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
    }

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_dialog_alert)
      .setContentTitle("พบ keyword: $keyword")
      .setContentText("อยู่ในแอป $packageName")
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setDefaults(NotificationCompat.DEFAULT_ALL)
      .setSound(soundUri)
      .setVibrate(longArrayOf(0, 250, 100, 250))
      .setAutoCancel(true)

    NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification.build())
    vibrateUser(context)
  }

  private fun createChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) == null) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = "Heads-up alerts สำหรับ Screen Text Detector"
        vibrationPattern = longArrayOf(0, 250, 100, 250)
        setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION), null)
      }
      manager.createNotificationChannel(channel)
    }
  }

  private fun vibrateUser(context: Context) {
    val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 250, 80, 200), -1))
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(longArrayOf(0, 250, 80, 200), -1)
    }
  }
}
