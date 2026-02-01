const db = require("../config/db");

const getAllFeedbacks = async () => {
  const result = await db.query(
    `SELECT 
      f.feedback_id as id,
      f.user_id as "userId",
      u.full_name as "userName",
      u.email as "userEmail",
      f.title,
      f.message,
      f.feedback_type as type,
      COALESCE(f.status, 'submitted') as status,
      f.admin_response as response,
      f.created_at as "createdAt",
      f.updated_at as "updatedAt"
    FROM feedbacks f
    JOIN users u ON f.user_id = u.user_id
    ORDER BY f.created_at DESC`
  );
  return result.rows;
};

const getFeedbackById = async (feedbackId) => {
  const result = await db.query(
    `SELECT 
      f.*,
      u.full_name,
      u.email,
      u.role
    FROM feedbacks f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.feedback_id = $1`,
    [feedbackId]
  );
  return result.rows[0];
};

const respondToFeedback = async (feedbackId, adminResponse) => {
  const result = await db.query(
    `UPDATE feedbacks 
     SET 
      admin_response = $1,
      status = 'responded',
      updated_at = CURRENT_TIMESTAMP
     WHERE feedback_id = $2
     RETURNING feedback_id as id, user_id as "userId", title, message, feedback_type as type, 
              status, admin_response as response, created_at as "createdAt", updated_at as "updatedAt"`,
    [adminResponse, feedbackId]
  );
  
  if (result.rows[0]) {
    return getFeedbackById(feedbackId);
  }
  return null;
};

module.exports = {
  getAllFeedbacks,
  getFeedbackById,
  respondToFeedback
};
