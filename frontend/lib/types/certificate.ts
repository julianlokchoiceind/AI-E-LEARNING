/**
 * Certificate types
 */

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  certificate_number: string;
  issue_date: string;
  expiry_date?: string;
  completion_date: string;
  final_score: number;
  total_hours: number;
  issuer_name: string;
  issuer_title: string;
  issuer_signature_url?: string;
  verification_url: string;
  verification_code: string;
  blockchain_hash?: string;
  template_id: string;
  background_color: string;
  accent_color: string;
  is_active: boolean;
  is_public: boolean;
  revoked_at?: string;
  revoke_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateWithDetails extends Certificate {
  course_title: string;
  course_description: string;
  course_level: string;
  course_category: string;
  course_creator: string;
  course_instructor?: string; // Alias for course_creator
  user_name: string;
  user_email: string;
}

export interface CertificateGenerateRequest {
  enrollment_id: string;
  template_id?: string;
}

export interface CertificateUpdate {
  is_public?: boolean;
  template_id?: string;
  background_color?: string;
  accent_color?: string;
}

export interface CertificateVerification {
  is_valid: boolean;
  certificate?: CertificateWithDetails;
  message: string;
}

export interface CertificateStats {
  total_certificates: number;
  courses_completed: number;
  total_hours_learned: number;
  average_score: number;
  certificates_by_category: Record<string, number>;
  certificates_by_year: Record<number, number>;
}

export interface LinkedInShareData {
  certificate_url: string;
  share_text: string;
  organization_name: string;
  issue_date: string;
  certificate_id: string;
}

export interface CertificateListResponse {
  items: CertificateWithDetails[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}