import axios from 'axios'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

const BASE_URL = 'https://api.dealkroo.com/api'

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// Request permission and get push token
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device')
    return false
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  return finalStatus === 'granted'
}

// Get the Expo push token
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    if (!projectId) {
      console.error('Missing projectId in app config')
      return null
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
    return tokenData.data
  } catch (error) {
    console.error('Failed to get push token:', error)
    return null
  }
}

// Register token with your backend
export async function registerPushTokenWithBackend(authToken: string): Promise<void> {
  try {
    const pushToken = await getExpoPushToken()
    if (!pushToken) return

    await axios.post(
      `${BASE_URL}/users/register-device-token`,
      {
        deviceToken: pushToken,
        platform: Platform.OS,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    )
    console.log('Push token registered successfully')
  } catch (error) {
    console.error('Failed to register push token:', error)
  }
}

// Unregister token on logout
export async function unregisterPushToken(authToken: string): Promise<void> {
  try {
    console.log('Unregistering push token')
    const pushToken = await getExpoPushToken()
    if (!pushToken) return

    console.log('Push token:', pushToken)
    console.log('Auth token:', authToken)
    console.log('making api call')

    await axios.delete(`${BASE_URL}/users/unregister-device-token`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { deviceToken: pushToken },
    })
    console.log('Push token unregistered')
  } catch (error) {
    console.error('Failed to unregister push token:', error)
  }
}

// Setup Android notification channel
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    })
  }
}

// Initialize notifications (call after user login)
export async function initializeNotifications(authToken: string): Promise<void> {
  const hasPermission = await requestNotificationPermissions()
  if (!hasPermission) return

  await setupNotificationChannel()
  await registerPushTokenWithBackend(authToken)
}

// Notification listeners (use in your root component)
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback)
}

export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback)
}

export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync()
}

// For testing: schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  })
}
