import api from './api';

export const feedbackService = {
  async enviar(mensagem: string): Promise<void> {
    await api.post('/feedback', { mensagem });
  },
};
