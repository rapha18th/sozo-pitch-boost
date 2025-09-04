const BASE_URL = 'https://rairo-pitch-helper-api.hf.space';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  credits: number;
  is_admin: boolean;
  createdAt: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async signUp(data: SignUpData, token: string): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Sign up failed');
    }

    return response.json();
  }

  async socialSignIn(token: string): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/api/auth/social-signin`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Social sign in failed');
    }

    return response.json();
  }

  async getUserProfile(token: string): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/api/user/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to get user profile');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();