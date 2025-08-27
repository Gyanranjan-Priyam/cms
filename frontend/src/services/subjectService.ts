import axios from 'axios';
import { getApiUrl } from '../config/api';

export interface SubjectInput {
  name: string;
  code: string;
  branch: string;
  description?: string;
  isActive?: boolean;
}

export const subjectService = {
  async list(params?: { branch?: string; search?: string; activeOnly?: boolean }) {
    const token = localStorage.getItem('token');
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.append('branch', params.branch);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.activeOnly) searchParams.append('activeOnly', 'true');
    const url = getApiUrl(`api/subjects${searchParams.toString() ? `?${searchParams}` : ''}`);
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return data;
  },

  async create(payload: SubjectInput) {
    const token = localStorage.getItem('token');
    const url = getApiUrl('api/subjects');
    const { data } = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
    return data;
  },

  async update(id: string, payload: Partial<SubjectInput>) {
    const token = localStorage.getItem('token');
    const url = getApiUrl(`api/subjects/${id}`);
    const { data } = await axios.put(url, payload, { headers: { Authorization: `Bearer ${token}` } });
    return data;
  },

  async remove(id: string, permanent = false) {
    const token = localStorage.getItem('token');
    const url = getApiUrl(`api/subjects/${id}${permanent ? '/permanent' : ''}`);
    const { data } = await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
    return data;
  }
};

export default subjectService;
