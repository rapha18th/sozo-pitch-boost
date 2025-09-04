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

export interface Project {
  projectId: string;
  userId: string;
  title: string;
  detectedUseCase: 'Job Interview' | 'Investor Pitch' | 'Academic Presentation';
  originalBriefingText: string;
  createdAt: string;
  practiceSessions: Record<string, Session>;
}

export interface Feedback {
  communicationScore: number;
  contentMasteryScore: number;
  engagementDeliveryScore: number;
  resilienceScore: number;
  qualitativeStrengths: string;
  qualitativeImprovements: string;
  contextSpecificFeedback: string;
}

export interface Session {
  sessionId: string;
  createdAt: string;
  durationSeconds: number;
  transcript: string;
  feedback?: Feedback;
}

export interface EndSessionResponse {
  status: string;
  sessionId: string;
  creditsDeducted: number;
  remainingCredits: number;
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

  async syncProfile(token: string): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/api/auth/social-signin`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to sync user profile');
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

  async requestCredits(token: string, requested_credits: number): Promise<{ success: boolean; requestId: string }> {
    const response = await fetch(`${BASE_URL}/api/user/request-credits`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ requested_credits }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to request credits');
    }
    return response.json();
  }

  async createProject(token: string, formData: FormData): Promise<Project> {
    const response = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create project');
    }
    return response.json();
  }

  async listProjects(token: string): Promise<Project[]> {
    const response = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to list projects');
    }
    return response.json();
  }

  async getProject(token: string, projectId: string): Promise<Project> {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to get project');
    }
    return response.json();
  }

  async updateProject(token: string, projectId: string, title: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update project');
    }
    return response.json();
  }

  async deleteProject(token: string, projectId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(token),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to delete project');
    }
    return response.json();
  }

  async getAgentBriefing(token: string, projectId: string): Promise<{ briefing: string }> {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/briefing`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to get agent briefing');
    }
    return response.json();
  }

  async getAgentUrl(token: string): Promise<{ signed_url: string }> {
    const response = await fetch(`${BASE_URL}/api/ai/get-agent-url`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to get agent URL');
    }
    return response.json();
  }

  async endSession(token: string, projectId: string, data: { durationSeconds: number; transcript: string }): Promise<EndSessionResponse> {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/sessions/end`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to end session');
    }
    return response.json();
  }

  async getSessionDetails(token: string, projectId: string, sessionId: string): Promise<Session> {
    const response = await fetch(`${BASE_URL}/api/projects/${projectId}/practiceSessions/${sessionId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to get session details');
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();