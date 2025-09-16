import axios from '../lib/axios';

export interface Feedback {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  title: string;
  message: string;
  type: 'ui_interface' | 'appointment_issue' | 'technical_support' | 'other';
  status: 'submitted' | 'reviewing' | 'responded' | 'resolved';
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export const feedbackService = {
  getAllFeedbacks: async () => {
    const response = await axios.get('/api/admin/complaints');
    return Array.isArray(response.data) ? response.data : [];
  },

  respondToFeedback: async (id: number, responseText: string) => {
    const response = await axios.put(`/api/admin/complaints/${id}/respond`, {
      adminResponse: responseText
    });
    return response.data;
  }
};

export default feedbackService;