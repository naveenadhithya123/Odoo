const db = require('../database/db');

async function getNotifications(req, res) {
  try {
    const notifications = await db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 30
    `).all(req.user.id);

    const unread = notifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      unreadCount: unread,
      data: notifications
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(req.user.id);
    } else {
      await db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(id, req.user.id);
    }
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

module.exports = {
  getNotifications,
  markAsRead
};
