import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        // Content is required only if there are no attachments
        return this.attachments.length === 0;
      },
      trim: true,
    },
    attachments: [
      {
        url: String,
        type: {
          type: String,
          enum: ["image", "video", "document", "audio"],
        },
        name: String,
        size: Number,
      },
    ],
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that either content or attachments exist
messageSchema.pre("save", function (next) {
  if (!this.content && (!this.attachments || this.attachments.length === 0)) {
    throw new Error("Message must have either content or attachments");
  }
  next();
});

// Indexes for better query performance
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
