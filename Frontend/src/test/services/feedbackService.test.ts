import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { feedbackService } from '../../services/feedbackService';

vi.mock('../../services/api', () => ({ default: { post: vi.fn() } }));

const post = vi.mocked(api.post);

describe('feedbackService', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('enviar calls api.post with /feedback and { mensagem: "oi" }', async () => {
    post.mockResolvedValue({ data: { _id: '1', criadoEm: '2026-10-23T12:00:00Z' } });

    await feedbackService.enviar('oi');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/feedback', { mensagem: 'oi' });
  });

  it('propagates the API rejection', async () => {
    const err = new Error('Network error');
    post.mockRejectedValue(err);

    await expect(feedbackService.enviar('oi')).rejects.toBe(err);
  });
});
