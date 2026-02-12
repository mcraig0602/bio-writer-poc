import mongoose from 'mongoose';
// NOTE: This will eventually come from the remote open-ai service.
const chatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  biographyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Biography',
    required: true
  }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;
