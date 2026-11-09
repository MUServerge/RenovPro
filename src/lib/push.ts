// Server-only Web Push helpers (phone notifications).
// Needs env: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
import webpush from "web-push";
import { prisma } from "@/lib/db";

let configured = false;

export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

function setup() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export type PushMessage = { title: string; body: string; url?: string };

// Sends to every device the user enabled. Subscriptions the push service
// reports as gone (404/410) are removed. Returns how many were delivered.
export async function sendPushToUser(
  userId: string,
  msg: PushMessage,
): Promise<number> {
  if (!pushConfigured()) return 0;
  setup();
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(msg),
        { TTL: 60 * 60 * 6 },
      );
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await prisma.pushSubscription
          .delete({ where: { id: s.id } })
          .catch(() => {});
      } else {
        console.error("push failed", code, err);
      }
    }
  }
  return sent;
}
