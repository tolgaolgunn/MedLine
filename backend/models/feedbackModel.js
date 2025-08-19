const db = require("../config/db");

const getAllFeedbacks = async () => {
  const result = await db.query(
    `SELECT 
      f.*,
      u.full_name,
      u.email,
      u.role
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
     RETURNING *`,
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
