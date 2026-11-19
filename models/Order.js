import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    pizzaId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const NotificationChannelSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["pending", "sending", "sent", "failed", "skipped"], default: "pending" },
    messageId: String,
    sentAt: Date,
    error: String,
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    accessTokenHash: { type: String, unique: true, sparse: true, select: false },
    checkoutSessionId: { type: String, unique: true, sparse: true, select: false },
    checkoutStarted: { type: Boolean, default: false },
    paymentIntentId: { type: String, select: false },
    paymentAttemptId: { type: String, select: false },
    pendingExpiresAt: { type: Date },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      smsOptIn: { type: Boolean, default: false },
    },
    position: { latitude: Number, longitude: Number },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one pizza.",
      },
    },
    priority: { type: Boolean, default: false },
    subtotalCents: { type: Number, required: true, min: 0 },
    priorityFeeCents: { type: Number, default: 0, min: 0 },
    totalCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: Date },
    orderStatus: {
      type: String,
      enum: ["pending_payment", "received", "preparing", "out_for_delivery", "delivered", "cancelled"],
      default: "received",
    },
    deliveryEstimateAt: { type: Date },
    notifications: {
      email: { type: NotificationChannelSchema, default: () => ({}) },
      sms: { type: NotificationChannelSchema, default: () => ({}) },
    },
  },
  { timestamps: true },
);

OrderSchema.index({ pendingExpiresAt: 1 }, { expireAfterSeconds: 0 });

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

export default Order;



