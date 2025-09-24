/**
 * Waitlist API client
 */
import { apiClient } from './api-client';
import { StandardResponse } from '@/lib/types/api';

export const waitlistAPI = {
  /**
   * Join waitlist - public endpoint
   */
  async joinWaitlist(data: { email: string }): Promise<StandardResponse<any>> {
    return apiClient.post<StandardResponse<any>>('/waitlist/join', data);
  },
};