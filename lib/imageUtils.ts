// lib/imageUtils.ts
export const getHighResTwitterImage = (profileImageUrl: string | undefined | null): string => {
    if (!profileImageUrl) {
      return "/cyrene_profile.png";
    }
    
    // Twitter profile images come with different size suffixes
    // _normal = 48x48 (default from API)
    // _bigger = 73x73
    // _400x400 = 400x400
    // No suffix = original size (usually highest quality)
    
    // Replace _normal with _400x400 for much better quality
    if (profileImageUrl.includes('_normal')) {
      return profileImageUrl.replace('_normal', '_400x400');
    }
    
    // If it already has a size suffix other than _normal, keep it
    // If no size suffix, it's already the original size
    return profileImageUrl;
  };
  
  export const getOptimizedImageUrl = (url: string | undefined | null, fallback: string = "/cyrene_profile.png"): string => {
    if (!url) {
      return fallback;
    }
    
    // Handle Twitter images
    if (url.includes('pbs.twimg.com')) {
      return getHighResTwitterImage(url);
    }
    
    // Handle other image sources
    return url;
  };