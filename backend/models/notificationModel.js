const pool = require('../config/db');

class NotificationModel {
  static async createNotification({ userId, type, title, message }) {
    const query = `
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, type, title, message]);
    return result.rows[0];
  }

  static async getNotificationsByUserId(userId) {
    const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async markAsRead(notificationId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE notification_id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId]);
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE user_id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = FALSE
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = NotificationModel;
