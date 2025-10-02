import { supabase } from '@/lib/supabase';

const CYRENE_AI_PROJECT_ID = 'd02f27c7-3c0c-46fe-a693-cbe3a61918f1';

export class VerificationService {
  // Check if user is a CyreneAI team member
  static async isCyreneAITeamMember(walletAddress: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('project_ideas')
        .select('team_members')
        .eq('id', CYRENE_AI_PROJECT_ID)
        .single();

      if (error || !data) return false;

      const teamMembers = data.team_members || [];
      return teamMembers.some(
        (member: any) => member.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking team membership:', error);
      return false;
    }
  }

  // Verify a project idea
  static async verifyProjectIdea(
    projectId: string,
    verifierWalletAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isTeamMember = await this.isCyreneAITeamMember(verifierWalletAddress);
      
      if (!isTeamMember) {
        return { success: false, error: 'Unauthorized: Not a CyreneAI team member' };
      }

      const { error } = await supabase
        .from('project_ideas')
        .update({
          is_verified: true,
          verified_by: verifierWalletAddress,
          verified_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error verifying project:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Unverify a project idea
  static async unverifyProjectIdea(
    projectId: string,
    verifierWalletAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isTeamMember = await this.isCyreneAITeamMember(verifierWalletAddress);
      
      if (!isTeamMember) {
        return { success: false, error: 'Unauthorized: Not a CyreneAI team member' };
      }

      const { error } = await supabase
        .from('project_ideas')
        .update({
          is_verified: false,
          verified_by: null,
          verified_at: null
        })
        .eq('id', projectId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unverifying project:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Verify a launched token
  static async verifyToken(
    contractAddress: string,
    verifierWalletAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isTeamMember = await this.isCyreneAITeamMember(verifierWalletAddress);
      
      if (!isTeamMember) {
        return { success: false, error: 'Unauthorized: Not a CyreneAI team member' };
      }

      const { error } = await supabase
        .from('launched_tokens')
        .update({
          is_verified: true,
          verified_by: verifierWalletAddress,
          verified_at: new Date().toISOString()
        })
        .eq('contract_address', contractAddress);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error verifying token:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Unverify a launched token
  static async unverifyToken(
    contractAddress: string,
    verifierWalletAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isTeamMember = await this.isCyreneAITeamMember(verifierWalletAddress);
      
      if (!isTeamMember) {
        return { success: false, error: 'Unauthorized: Not a CyreneAI team member' };
      }

      const { error } = await supabase
        .from('launched_tokens')
        .update({
          is_verified: false,
          verified_by: null,
          verified_at: null
        })
        .eq('contract_address', contractAddress);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unverifying token:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}