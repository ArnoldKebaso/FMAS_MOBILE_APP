import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
  return response.data;
};

export const register = async (userData: any) => {

};
