import { Resend } from "resend";
import twilio from "twilio";
import Order from "../models/Order";

const E164_PHONE = /^\+[1-9]\d{7,14}$/;

function normalizePhone(value) {
  const normalized = String(value ?? "").replace(/[\s().-]/g, "");
  return E164_PHONE.test(normalized) ? normalized : null;
}

function formatTotal(order) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(order.currency || "USD").toUpperCase(),
  }).format(order.totalCents / 100);
}

async function claimChannel(orderId, channel) {
  const statusPath = `notifications.${channel}.status`;
  const basePath = `notifications.${channel}`;
  return Order.findOneAndUpdate(
    {
      _id: orderId,
      $or: [
        { [statusPath]: "pending" },
        { [statusPath]: { $exists: false } },
      ],
    },
    {
      $set: {
        [`${basePath}.status`]: "sending",
        [`${basePath}.error`]: "",
      },
    },
    { new: true },
  );
}

async function updateChannel(orderId, channel, values) {
  await Order.updateOne(
    { _id: orderId },
    { $set: Object.fromEntries(Object.entries(values).map(([key, value]) => [`notifications.${channel}.${key}`, value])) },
  );
}

async function notifyEmail(order) {
  const email = String(order.customer?.email ?? "").trim();
  if (!email) return;
  const claimed = await claimChannel(order._id, "email");
  if (!claimed) return;

  try {
    if (!process.env.RESEND_API_KEY || !process.env.ORDER_EMAIL_FROM) {
      throw new Error("Email notification provider is not configured.");
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const lines = [
      `Thanks for ordering from Joey's Pizza.`,
      `Your payment is confirmed for order #${order.orderNumber}.`,
      `Total: ${formatTotal(order)}.`,
      "You can track the order by searching for this confirmation number on the website.",
    ];
    const { data, error } = await resend.emails.send({
      from: process.env.ORDER_EMAIL_FROM,
      to: email,
      subject: `Joey's Pizza order #${order.orderNumber} confirmed`,
      text: lines.join("\n\n"),
    });
    if (error) throw new Error(error.message || "Email provider rejected the message.");
    await updateChannel(order._id, "email", {
      status: "sent",
      messageId: data?.id || "",
      sentAt: new Date(),
      error: "",
    });
  } catch (error) {
    console.error("Order confirmation email failed:", error.message);
    await updateChannel(order._id, "email", {
      status: "failed",
      error: String(error.message || "Email delivery failed.").slice(0, 300),
    });
  }
}

async function notifySms(order) {
  if (order.customer?.smsOptIn !== true) return;
  const phone = normalizePhone(order.customer?.phone);
  const claimed = await claimChannel(order._id, "sms");
  if (!claimed) return;

  try {
    if (!phone) throw new Error("Text updates require a phone number in international E.164 format.");
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_FROM_NUMBER
    ) {
      throw new Error("SMS notification provider is not configured.");
    }
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to: phone,
      body: `Joey's Pizza: payment confirmed for order #${order.orderNumber}. Total ${formatTotal(order)}. Track it using the confirmation number on our website. Reply HELP for help or STOP to opt out.`,
    });
    await updateChannel(order._id, "sms", {
      status: "sent",
      messageId: message.sid,
      sentAt: new Date(),
      error: "",
    });
  } catch (error) {
    console.error("Order confirmation SMS failed:", error.message);
    await updateChannel(order._id, "sms", {
      status: "failed",
      error: String(error.message || "SMS delivery failed.").slice(0, 300),
    });
  }
}

export async function sendOrderNotifications(order) {
  if (process.env.ORDER_NOTIFICATIONS_ENABLED !== "true") return;
  await Promise.allSettled([notifyEmail(order), notifySms(order)]);
}
