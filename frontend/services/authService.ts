import { AUTH_API_URL } from '@/lib/constants';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  UserProfile,
  ErrorResponse
} from '@/types/auth';

export const authService = {

  async login(credentials: LoginRequest): Promise<LoginResponse> {

    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data;
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${AUTH_API_URL}/register`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    const data: RegisterResponse = await response.json();
    
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data;
  },

  async getProfile(): Promise<UserProfile> {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) throw new Error('No access token found')

    const response = await fetch(`${AUTH_API_URL}/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}`},
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.refreshToken();
        return this.getProfile();
      }
      
      const errorData: ErrorResponse = await response.json();
      throw new Error(errorData.message || 'Failed to get profile');
    }

    const profile: UserProfile = await response.json();
  
    localStorage.setItem('userId', profile.sub);
    
    return profile;
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    const userId = localStorage.getItem('userId');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!userId || !refreshToken) throw new Error('No user ID or refresh token found');

    const refreshData: RefreshTokenRequest = {
      userId,
      refreshToken,
    };

    const response = await fetch(`${AUTH_API_URL}/refresh`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(refreshData),
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Session expired. Please login again.');
    }

    const data: RefreshTokenResponse = await response.json();
    
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    return data;
  },

  async logout(): Promise<void> {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      try {
        await fetch(`${AUTH_API_URL}/logout`, {
          method: 'POST',
          headers: {'Authorization': `Bearer ${accessToken}`},
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  setupTokenRefresh(): void {
    // Refresh token every 2 minutes
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().catch(console.error);
      }
    }, 2 * 60 * 1000); // 2 minutes
  }
};