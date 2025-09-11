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
   * Get a specific project idea by ID (requires wallet address for security)
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
   * Get a specific project idea by ID (public access for preview)
   */
  static async getPublicProjectIdeaById(ideaId: string): Promise<ProjectIdeaData | null> {
    try {
      const { data, error } = await supabase
        .from('project_ideas')
        .select('*')
        .eq('id', ideaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching public project idea by ID:', error);
        throw new Error(`Failed to fetch project idea: ${error.message}`);
      }

      if (!data) return null;

      return projectIdeaDbToFrontend(data as ProjectIdeaDB);
    } catch (error) {
      console.error('Service error fetching public project idea by ID:', error);
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

  /**
   * Get public project ideas by multiple IDs (for batch loading)
   */
  static async getPublicProjectIdeasByIds(ideaIds: string[]): Promise<ProjectIdeaData[]> {
    try {
      if (ideaIds.length === 0) return [];

      const { data, error } = await supabase
        .from('project_ideas')
        .select('*')
        .in('id', ideaIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching public project ideas by IDs:', error);
        throw new Error(`Failed to fetch project ideas: ${error.message}`);
      }

      if (!data) return [];

      return data.map(projectIdeaDbToFrontend);
    } catch (error) {
      console.error('Service error fetching public project ideas by IDs:', error);
      throw error;
    }
  }

  /**
   * Get project ideas with pagination and filtering
   */
  static async getProjectIdeasWithFilters(
    filters: {
      category?: string;
      industry?: string;
      stage?: 'ideation' | 'cooking';
      isLaunched?: boolean;
      walletAddress?: string;
    },
    pagination: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: ProjectIdeaData[]; total: number }> {
    try {
      const { limit = 50, offset = 0 } = pagination;
      
      let query = supabase
        .from('project_ideas')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('project_category', filters.category);
      }
      if (filters.industry) {
        query = query.eq('project_industry', filters.industry);
      }
      if (filters.stage) {
        query = query.eq('project_stage', filters.stage);
      }
      if (filters.isLaunched !== undefined) {
        query = query.eq('is_launched', filters.isLaunched);
      }
      if (filters.walletAddress) {
        query = query.eq('wallet_address', filters.walletAddress);
      }

      // Apply pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching filtered project ideas:', error);
        throw new Error(`Failed to fetch project ideas: ${error.message}`);
      }

      return {
        data: (data || []).map(projectIdeaDbToFrontend),
        total: count || 0
      };
    } catch (error) {
      console.error('Service error fetching filtered project ideas:', error);
      throw error;
    }
  }

  /**
   * Get trending project ideas (based on recent activity)
   */
  static async getTrendingProjectIdeas(limit: number = 10): Promise<ProjectIdeaData[]> {
    try {
      // Get recently created or updated project ideas
      const { data, error } = await supabase
        .from('project_ideas')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trending project ideas:', error);
        throw new Error(`Failed to fetch trending project ideas: ${error.message}`);
      }

      if (!data) return [];

      return data.map(projectIdeaDbToFrontend);
    } catch (error) {
      console.error('Service error fetching trending project ideas:', error);
      throw error;
    }
  }

  /**
   * Get project statistics
   */
  static async getProjectStatistics(): Promise<{
    total: number;
    byStage: { ideation: number; cooking: number };
    launched: number;
    byCategory: { [key: string]: number };
    byIndustry: { [key: string]: number };
  }> {
    try {
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('project_ideas')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get counts by stage
      const { data: stageData, error: stageError } = await supabase
        .from('project_ideas')
        .select('project_stage')
        .not('project_stage', 'is', null);

      if (stageError) throw stageError;

      // Get launched count
      const { count: launched, error: launchedError } = await supabase
        .from('project_ideas')
        .select('*', { count: 'exact', head: true })
        .eq('is_launched', true);

      if (launchedError) throw launchedError;

      // Get counts by category
      const { data: categoryData, error: categoryError } = await supabase
        .from('project_ideas')
        .select('project_category')
        .not('project_category', 'is', null);

      if (categoryError) throw categoryError;

      // Get counts by industry
      const { data: industryData, error: industryError } = await supabase
        .from('project_ideas')
        .select('project_industry')
        .not('project_industry', 'is', null);

      if (industryError) throw industryError;

      // Process stage counts
      const byStage = { ideation: 0, cooking: 0 };
      stageData?.forEach(item => {
        if (item.project_stage === 'ideation') byStage.ideation++;
        else if (item.project_stage === 'cooking') byStage.cooking++;
      });

      // Process category counts
      const byCategory: { [key: string]: number } = {};
      categoryData?.forEach(item => {
        if (item.project_category) {
          byCategory[item.project_category] = (byCategory[item.project_category] || 0) + 1;
        }
      });

      // Process industry counts
      const byIndustry: { [key: string]: number } = {};
      industryData?.forEach(item => {
        if (item.project_industry) {
          byIndustry[item.project_industry] = (byIndustry[item.project_industry] || 0) + 1;
        }
      });

      return {
        total: total || 0,
        byStage,
        launched: launched || 0,
        byCategory,
        byIndustry
      };
    } catch (error) {
      console.error('Service error fetching project statistics:', error);
      throw error;
    }
  }
}