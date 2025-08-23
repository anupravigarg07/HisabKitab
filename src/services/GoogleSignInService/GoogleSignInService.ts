import {
  GoogleSignin,
  statusCodes,
  User,
  SignInResponse,
  SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';

class GoogleSignInService {
  private isConfigured = false;

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
  }

  async getAccessToken(): Promise<string> {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not signed in');
      }
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
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
