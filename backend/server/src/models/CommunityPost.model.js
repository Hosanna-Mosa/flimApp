const { Schema, model, Types } = require('mongoose');

const CommunityPostSchema = new Schema(
  {
    community: { 
      type: Types.ObjectId, 
      ref: 'Community', 
      required: true,
      index: true 
    },
    group: { 
      type: Types.ObjectId, 
      required: true,
      index: true 
    },
    author: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    
    // Content
    type: { 
      type: String, 
      enum: ['text', 'image', 'video', 'poll', 'announcement'], 
      default: 'text' 
    },
    /**
     * Not required. A photo needs no caption, and requiring one forced the
     * client to send the literal word "Image", which then rendered as the
     * caption under every picture in the group.
     */
    content: { type: String, default: '', maxlength: 5000 },
    media: [{
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video', 'document'] },
      thumbnail: { type: String },
      size: { type: Number },
      format: { type: String },
      /** Needed to remove the file from Cloudinary when the post is deleted. */
      publicId: { type: String },
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number }
    }],

    /**
     * The message this one answers. A snapshot rather than a lookup, for the
     * same reason as direct messages: the original can be deleted, and a quote
     * that silently empties leaves a reply to nothing.
     */
    replyTo: {
      postId: { type: Types.ObjectId, ref: 'CommunityPost' },
      senderName: { type: String },
      preview: { type: String, maxlength: 200 },
      mediaType: { type: String, enum: ['image', 'video'] }
    },
    
    // Poll (if type=poll)
    poll: {
      question: { type: String },
      options: [{
        text: { type: String, required: true },
        votes: [{ type: Types.ObjectId, ref: 'User' }]
      }],
      endsAt: { type: Date },
      allowMultiple: { type: Boolean, default: false }
    },
    
    // Engagement
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    comments: [{ type: Types.ObjectId, ref: 'Comment' }],
    commentsCount: { type: Number, default: 0 },
    
    // Moderation
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },
    pinnedBy: { type: Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes
CommunityPostSchema.index({ community: 1, createdAt: -1 });
CommunityPostSchema.index({ group: 1, createdAt: -1 });
CommunityPostSchema.index({ isPinned: 1, createdAt: -1 });
CommunityPostSchema.index({ author: 1, createdAt: -1 });
CommunityPostSchema.index({ isDeleted: 1 });

module.exports = model('CommunityPost', CommunityPostSchema);
