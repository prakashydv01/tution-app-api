import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { sendPushNotification } from "./push";

type NotificationType = "inquiry_received" | "inquiry_contacted" | "new_review" | "tutor_verified" | "tutor_applied";

interface NotifyUserOptions {
  userId: string;
  expoPushToken: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Always creates the in-app notification record (so the bell icon has something to
 * show even if push fails, isn't configured, or the user's device is offline), and
 * also sends a push if the user has a token registered. Call this instead of
 * sendPushNotification directly at every trigger point.
 */
export async function notifyUser(opts: NotifyUserOptions) {
  await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data as Prisma.InputJsonValue | undefined,
    },
  });

  if (opts.expoPushToken) {
    await sendPushNotification({
      to: opts.expoPushToken,
      title: opts.title,
      body: opts.body,
      data: { type: opts.type, ...opts.data },
    });
  }
}