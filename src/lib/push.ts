interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Push delivery is always best-effort: it never throws, so a notification failure
// (invalid token, Expo's push service being down, etc.) never breaks the request
// that triggered it — the inquiry/review/verification itself still succeeds either way.
export async function sendPushNotification(message: ExpoPushMessage) {
  if (!message.to || !message.to.startsWith("ExponentPushToken")) return;

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ ...message, sound: "default" }),
    });
  } catch (e) {
    console.error("Failed to send push notification:", e);
  }
}