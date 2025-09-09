// services/projectIdeasService.ts
import { 
    supabase, 
    ProjectIdeaData, 
    ProjectIdeaDB, 
    projectIdeaDbToFrontend, 
    projectIdeaFrontendToDb,
    ProjectCategory,
    ProjectIndustry
  } from '@/lib/supabase';
  
  export class ProjectIdeasService {
    /**
     * Get all project categories
     */
    static async getProjectCategories(): Promise<ProjectCategory[]> {
      try {
        const { data, error } = await supabase
          .from('project_categories')
          .select('*')
          .order('name');
  
        if (error) {
          console.error('Error fetching project categories:', error);
          throw new Error(`Failed to fetch project categories: ${error.message}`);
        }
  
        return data || [];
      } catch (error) {
        console.error('Service error fetching project categories:', error);
        throw error;
      }
    }
  
    /**
     * Get all project industries
     */
    static async getProjectIndustries(): Promise<ProjectIndustry[]> {
      try {
        const { data, error } = await supabase
          .from('project_industries')
          .select('*')
          .order('name');
  
        if (error) {
          console.error('Error fetching project industries:', error);
          throw new Error(`Failed to fetch project industries: ${error.message}`);
        }
  
        return data || [];
      } catch (error) {
        console.error('Service error fetching project industries:', error);
        throw error;
      }
    }
  
    /**
     * Get all project ideas for a specific wallet address
     */
    static async getProjectIdeas(walletAddress: string): Promise<ProjectIdeaData[]> {
      try {
        const { data, error } = await supabase
          .from('project_ideas')
          .select('*')
          .eq('wallet_address', walletAddress)
          .order('created_at', { ascending: false });
  
        if (error) {
          console.error('Error fetching project ideas:', error);
          throw new Error(`Failed to fetch project ideas: ${error.message}`);
        }
  
        if (!data) return [];
  
        return data.map(projectIdeaDbToFrontend);
      } catch (error) {
        console.error('Service error fetching project ideas:', error);
        throw error;
      }
    }
  
    /**
     * Get a specific project idea by ID
     */
    static async getProjectIdeaById(
      ideaId: string, 
      walletAddress: string
    ): Promise<ProjectIdeaData | null> {
      try {
        const { data, error } = await supabase
          .from('project_ideas')
          .select('*')
          .eq('id', ideaId)
          .eq('wallet_address', walletAddress)
          .single();
  
        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          console.error('Error fetching project idea by ID:', error);
          throw new Error(`Failed to fetch project idea: ${error.message}`);
        }
  
        if (!data) return null;
  
        return projectIdeaDbToFrontend(data as ProjectIdeaDB);
      } catch (error) {
        console.error('Service error fetching project idea by ID:', error);
        throw error;
      }
    }
  
    /**
     * Save a new project idea
     */
    static async saveProjectIdea(
      ideaData: ProjectIdeaData, 
      walletAddress: string
    ): Promise<ProjectIdeaData> {
      try {
        const dbData = projectIdeaFrontendToDb(ideaData, walletAddress);
  
        const { data, error } = await supabase
          .from('project_ideas')
          .insert([dbData])
          .select('*')
          .single();
  
        if (error) {
          console.error('Error saving project idea:', error);
          throw new Error(`Failed to save project idea: ${error.message}`);
        }
  
        if (!data) {
          throw new Error('No data returned from insert operation');
        }
  
        return projectIdeaDbToFrontend(data as ProjectIdeaDB);
      } catch (error) {
        console.error('Service error saving project idea:', error);
        throw error;
      }
    }
  
    /**
     * Update an existing project idea
     */
    static async updateProjectIdea(
      ideaId: string,
      walletAddress: string,
      updates: Partial<ProjectIdeaData>
    ): Promise<ProjectIdeaData | null> {
      try {
        const dbUpdates: Partial<Omit<ProjectIdeaDB, 'id' | 'created_at' | 'updated_at'>> = {};
        
        if (updates.projectName !== undefined) dbUpdates.project_name = updates.projectName;
        if (updates.projectDescription !== undefined) dbUpdates.project_description = updates.projectDescription;
        if (updates.projectCategory !== undefined) dbUpdates.project_category = updates.projectCategory;
        if (updates.projectIndustry !== undefined) dbUpdates.project_industry = updates.projectIndustry;
        if (updates.projectImage !== undefined) dbUpdates.project_image = updates.projectImage;
        if (updates.githubUrl !== undefined) dbUpdates.github_url = updates.githubUrl;
        if (updates.websiteUrl !== undefined) dbUpdates.website_url = updates.websiteUrl;
        if (updates.whitepaperUrl !== undefined) dbUpdates.whitepaper_url = updates.whitepaperUrl;
        if (updates.projectStage !== undefined) dbUpdates.project_stage = updates.projectStage;
        if (updates.teamMembers !== undefined) dbUpdates.team_members = updates.teamMembers;
        if (updates.tokenName !== undefined) dbUpdates.token_name = updates.tokenName;
        if (updates.tokenSymbol !== undefined) dbUpdates.token_symbol = updates.tokenSymbol;
        if (updates.totalTokenSupply !== undefined) dbUpdates.total_token_supply = updates.totalTokenSupply;
        if (updates.migrationQuoteThreshold !== undefined) dbUpdates.migration_quote_threshold = updates.migrationQuoteThreshold;
        if (updates.quoteMint !== undefined) dbUpdates.quote_mint = updates.quoteMint;
        if (updates.enableFirstBuy !== undefined) dbUpdates.enable_first_buy = updates.enableFirstBuy;
        if (updates.firstBuyAmountSol !== undefined) dbUpdates.first_buy_amount_sol = updates.firstBuyAmountSol;
        if (updates.minimumTokensOut !== undefined) dbUpdates.minimum_tokens_out = updates.minimumTokensOut;
        if (updates.tradeStatus !== undefined) dbUpdates.trade_status = updates.tradeStatus;
        if (updates.isLaunched !== undefined) dbUpdates.is_launched = updates.isLaunched;
        if (updates.launchedTokenId !== undefined) dbUpdates.launched_token_id = updates.launchedTokenId;
  
        const { data, error } = await supabase
          .from('project_ideas')
          .update(dbUpdates)
          .eq('id', ideaId)
          .eq('wallet_address', walletAddress)
          .select('*')
          .single();
  
        if (error) {
          console.error('Error updating project idea:', error);
          throw new Error(`Failed to update project idea: ${error.message}`);
        }
  
        if (!data) {
          console.warn('No project idea found to update');
          return null;
        }
  
        return projectIdeaDbToFrontend(data as ProjectIdeaDB);
      } catch (error) {
        console.error('Service error updating project idea:', error);
        throw error;
      }
    }
  
    /**
     * Delete a project idea
     */
    static async deleteProjectIdea(ideaId: string, walletAddress: string): Promise<boolean> {
      try {
        const { error } = await supabase
          .from('project_ideas')
          .delete()
          .eq('id', ideaId)
          .eq('wallet_address', walletAddress);
  
        if (error) {
          console.error('Error deleting project idea:', error);
          throw new Error(`Failed to delete project idea: ${error.message}`);
        }
  
        return true;
      } catch (error) {
        console.error('Service error deleting project idea:', error);
        throw error;
      }
    }
  
    /**
     * Move project from ideation to cooking stage
     */
    static async moveToFundraiseStage(
      ideaId: string,
      walletAddress: string,
      tokenDetails: {
        tokenName: string;
        tokenSymbol: string;
        totalTokenSupply: number;
        migrationQuoteThreshold: number;
        quoteMint: string;
        enableFirstBuy: boolean;
        firstBuyAmountSol: number;
        minimumTokensOut: number;
        tradeStatus: boolean;
      }
    ): Promise<ProjectIdeaData | null> {
      try {
        const updates = {
          projectStage: 'cooking' as const,
          ...tokenDetails
        };
  
        return await this.updateProjectIdea(ideaId, walletAddress, updates);
      } catch (error) {
        console.error('Service error moving to fundraise stage:', error);
        throw error;
      }
    }
  
    /**
     * Mark project as launched and link to token
     */
    static async markAsLaunched(
      ideaId: string,
      walletAddress: string,
      launchedTokenId: string
    ): Promise<ProjectIdeaData | null> {
      try {
        const updates = {
          isLaunched: true,
          launchedTokenId: launchedTokenId
        };
  
        return await this.updateProjectIdea(ideaId, walletAddress, updates);
      } catch (error) {
        console.error('Service error marking as launched:', error);
        throw error;
      }
    }
  
    /**
     * Get all public project ideas for exploration (for public feed)
     */
    static async getPublicProjectIdeas(
      limit: number = 50, 
      offset: number = 0,
      stage?: 'ideation' | 'cooking'
    ): Promise<ProjectIdeaData[]> {
      try {
        let query = supabase
          .from('project_ideas')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
  
        if (stage) {
          query = query.eq('project_stage', stage);
        }
  
        const { data, error } = await query;
  
        if (error) {
          console.error('Error fetching public project ideas:', error);
          throw new Error(`Failed to fetch public project ideas: ${error.message}`);
        }
  
        if (!data) return [];
  
        return data.map(projectIdeaDbToFrontend);
      } catch (error) {
        console.error('Service error fetching public project ideas:', error);
        throw error;
      }
    }
  
    /**
     * Search project ideas
     */
    static async searchProjectIdeas(
      query: string, 
      limit: number = 20,
      walletAddress?: string
    ): Promise<ProjectIdeaData[]> {
      try {
        let searchQuery = supabase
          .from('project_ideas')
          .select('*')
          .or(`project_name.ilike.%${query}%,project_description.ilike.%${query}%,project_category.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(limit);
  
        if (walletAddress) {
          searchQuery = searchQuery.eq('wallet_address', walletAddress);
        }
  
        const { data, error } = await searchQuery;
  
        if (error) {
          console.error('Error searching project ideas:', error);
          throw new Error(`Failed to search project ideas: ${error.message}`);
        }
  
        if (!data) return [];
  
        return data.map(projectIdeaDbToFrontend);
      } catch (error) {
        console.error('Service error searching project ideas:', error);
        throw error;
      }
    }
  }