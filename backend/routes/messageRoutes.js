const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// POST /api/messages - Send a new message (user or admin)
router.post('/', async (req, res) => {
  try {
    const { userEmail, userName, sender, message } = req.body;
    if (!userEmail || !sender || !message) {
      return res.status(400).json({ message: 'userEmail, sender, and message are required.' });
    }

    const newMessage = await Message.create({
      userEmail,
      userName: userName || userEmail.split('@')[0],
      sender,
      message
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages?email=<userEmail> - Fetch chat history for a specific user
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query param required.' });
    }
    const messages = await Message.find({ userEmail: email }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/conversations - List all distinct user conversations for Admin
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $match: { userEmail: { $exists: true, $ne: null } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userEmail',
          userName: { $first: '$userName' },
          lastMessage: { $first: '$message' },
          lastSender: { $first: '$sender' },
          updatedAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$read', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/messages?email=<userEmail> - Delete whole conversation for a user
router.delete('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email query param required.' });
    }
    const result = await Message.deleteMany({ userEmail: email });
    res.json({ message: 'Conversation deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/messages/:id - Delete single message
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
