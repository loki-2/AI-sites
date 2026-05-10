// ===========================================
// Type Definitions
// ===========================================

// -------------------------------------------
// API Response Types
// -------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// -------------------------------------------
// Vibecoders Profiles & Projects
// -------------------------------------------

export interface VibecoderBadge {
  name: string;
  level: "moderate" | "expert" | "beginner" | string;
}

export interface VibecoderProfile {
  id: string; // UUID from auth.users
  name: string;
  bio?: string;
  avatar_url?: string;
  social_url?: string;
  location?: string;
  build_tags?: string[];
  github_username?: string;
  availability?: string;
  badges: VibecoderBadge[];
  total_projects: number;
  shipped_projects: number;
  in_progress_projects: number;
  experiment_projects: number;
  created_at: string;
  updated_at: string;

  // Verification features
  is_verified?: boolean;
  verification_status?: 'none' | 'pending' | 'approved' | 'rejected' | string;
  is_mvp_builder?: boolean;

  // Extended UI property, conditionally loaded
  projects?: VibecoderProject[];
}

export interface VibecoderProject {
  id: string;
  profile_id: string;
  name: string;
  description: string;
  tags: string[]; // e.g., 'shipped', 'half baked', 'experiment'
  images: string[];
  live_link?: string;
  created_at: string;
  updated_at: string;
}
