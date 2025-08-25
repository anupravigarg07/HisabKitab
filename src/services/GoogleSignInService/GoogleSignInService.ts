import {
  GoogleSignin,
  statusCodes,
  User,
  SignInResponse,
  SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';

class GoogleSignInService {
  private isConfigured = false;
  private tokenPromise: Promise<string> | null = null;
  private lastTokenTime = 0;
  private cachedToken: string | null = null;
  private readonly TOKEN_CACHE_DURATION = 5 * 60 * 1000;

  constructor() {
    this.configure();
  }

  private configure() {
    if (!this.isConfigured) {
      GoogleSignin.configure({
        webClientId:
          '994279805845-76n6ridsflhlce41005uoq80jnblhc00.apps.googleusercontent.com',
        scopes: [
          'email',
          'profile',
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
        ],
        offlineAccess: true,
      });
      this.isConfigured = true;
    }
  }

  async signIn(): Promise<User | null> {
    try {
      await GoogleSignin.hasPlayServices();
      console.log('Hello ');

      const signInResponse: SignInResponse = await GoogleSignin.signIn();
      console.log('SignInResponse', signInResponse);

      if (signInResponse.type === 'success') {
        // Clear any cached tokens when user signs in
        this.clearTokenCache();
        return (signInResponse as SignInSuccessResponse).data;
      }

      // Cancelled
      console.warn('Sign in cancelled by user');
      return null;
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const userInfo = await GoogleSignin.getCurrentUser();
    return userInfo || null;
  }

  async signOut(): Promise<void> {
    await GoogleSignin.signOut();
    this.clearTokenCache();
  }

  private clearTokenCache() {
    this.cachedToken = null;
    this.lastTokenTime = 0;
    this.tokenPromise = null;
  }

  private isTokenCacheValid(): boolean {
    return (
      this.cachedToken !== null &&
      Date.now() - this.lastTokenTime < this.TOKEN_CACHE_DURATION
    );
  }

  async getAccessToken(): Promise<string> {
    try {
      // Return cached token if still valid
      if (this.isTokenCacheValid()) {
        console.log('Using cached access token');
        return this.cachedToken!;
      }

      // If there's already a token request in progress, wait for it
      if (this.tokenPromise) {
        console.log('Waiting for existing token request');
        return await this.tokenPromise;
      }

      // Start a new token request
      console.log('Fetching new access token');
      this.tokenPromise = this.fetchNewAccessToken();

      try {
        const token = await this.tokenPromise;
        return token;
      } finally {
        // Clear the promise after completion (success or failure)
        this.tokenPromise = null;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      // Clear cache and promise on error
      this.clearTokenCache();
      throw error;
    }
  }

  private async fetchNewAccessToken(): Promise<string> {
    const currentUser = await GoogleSignin.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not signed in');
    }

    const tokens = await GoogleSignin.getTokens();

    // Cache the token
    this.cachedToken = tokens.accessToken;
    this.lastTokenTime = Date.now();

    console.log('Access token fetched and cached');
    return tokens.accessToken;
  }

  getErrorMessage(error: any): string {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return 'Sign-In Cancelled';
      case statusCodes.IN_PROGRESS:
        return 'Sign-In already in progress';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Play Services not available';
      default:
        return error.message || 'Something went wrong';
    }
  }
}

export default new GoogleSignInService();
