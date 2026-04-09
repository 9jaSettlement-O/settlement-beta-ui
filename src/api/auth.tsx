import type { AxiosInstance } from "axios";
import type { IAPIResponse } from "@/types/api.types";
import { BaseService } from "@/services/api/base.service";
import { API_ENDPOINTS } from "@/lib/constants";
class Auth extends BaseService {
  constructor(axiosPublic: AxiosInstance, axiosPrivate: AxiosInstance) {
    super(axiosPublic, axiosPrivate);
  }

  /**
   * Register a new user account
   */
  async register(data: {
    email: string;
    password: string;
    accountType: string;
    referralCode?: string;
    promoCode?: string;
  }): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.AUTH.REGISTER, data, false);
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(uid: string, token: string): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.ACCOUNT.ACTIVATE, { uid, token }, false);
  }

  /**
   * Resend OTP (backend: POST /api/as/v1/users/auth/resend-email-otp with { email })
   */
  async resendOTP(email: string): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.ACCOUNT.ACTIVATION, { email }, false);
  }

  /**
   * Login — User Service body is `{ email, password }` only (see /v3/api-docs).
   */
  async login(data: { email: string; password: string }): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.AUTH.LOGIN, { email: data.email, password: data.password }, false);
  }

  /**
   * Request password reset email.
   * When API is ready: POST /account/forgot-password/ with { email }.
   */
  async requestPasswordReset(email: string): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }, false);
  }

  /**
   * Get KYC token for Sumsub
   */
  async getKycToken(uid: string): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.ACCOUNT.KYC_TOKEN, { uid }, false);
  }

  /**
   * Setup transaction PIN
   */
  async setupPin(uid: string, encryptedPin: string): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.ACCOUNT.SET_PIN(uid), { pin: encryptedPin }, false);
  }

  /**
   * Save biodata/profile information
   */
  async saveBiodata(data: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    country: string;
    state: string;
    address: string;
  }): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.ACCOUNT.PROFILE, data, false);
  }

  /**
   * Send phone verification OTP
   */
  async sendPhoneOTP(phone: string): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.PHONE.SEND_OTP, { phone }, false);
  }

  /**
   * Verify phone with OTP
   */
  async verifyPhone(phone: string, otp: string): Promise<IAPIResponse> {
    return this.post(API_ENDPOINTS.PHONE.VERIFY_OTP, { phone, otp }, false);
  }
}

export default Auth;
