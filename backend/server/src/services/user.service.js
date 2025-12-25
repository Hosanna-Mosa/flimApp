const User = require('../models/User.model');

const getMe = async (userId) => User.findById(userId).select('-password -refreshTokens');

const updateMe = async (userId, payload) =>
  User.findByIdAndUpdate(userId, payload, { new: true }).select(
    '-password -refreshTokens'
  );

const getById = async (id) => User.findById(id).select('-password -refreshTokens');

const search = async ({ q, roles, industries }) => {
  console.log('[User Service] Search params - q:', q, 'roles:', roles, 'industries:', industries);
  
  // If no search query and no filters, return empty
  if (!q && (!roles || roles.length === 0) && (!industries || industries.length === 0)) {
    return [];
  }

  let query = {};
  let hasFilters = false;
  
  // Build filter query for roles and industries (these are AND conditions)
  if (roles) {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    if (rolesArray.length > 0) {
      query.roles = { $in: rolesArray };
      hasFilters = true;
    }
  }
  
  if (industries) {
    const industriesArray = Array.isArray(industries) ? industries : [industries];
    if (industriesArray.length > 0) {
      query.industries = { $in: industriesArray };
      hasFilters = true;
    }
  }

  // If there's a text query, add OR search across multiple fields
  if (q) {
    // If we have filters, we need to combine them with the text search
    // Filters are AND, text search is OR within the filtered results
    const textSearchConditions = [
      { name: { $regex: q, $options: 'i' } },
      { roles: { $regex: q, $options: 'i' } },
      { industries: { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
    ];
    
    if (hasFilters) {
      // Combine filters (AND) with text search (OR)
      query = {
        ...query,
        $or: textSearchConditions
      };
    } else {
      // Only text search, no filters
      query.$or = textSearchConditions;
    }
  }

  console.log('[User Service] MongoDB query:', JSON.stringify(query));
  const results = await User.find(query).select('name avatar roles industries location bio isVerified isOnline');
  console.log('[User Service] Found users:', results.length);
  
  // Score and sort results by relevance
  if (results.length > 0) {
    const searchLower = q ? q.toLowerCase() : '';
    
    const scoredResults = results.map(user => {
      let score = 0;
      const userObj = user.toObject();
      
      // If text query exists, apply text-based scoring
      if (q && searchLower) {
        // Priority 1: Name match (highest score)
        if (userObj.name && userObj.name.toLowerCase().includes(searchLower)) {
          // Exact match gets highest score
          if (userObj.name.toLowerCase() === searchLower) {
            score += 1000;
          }
          // Starts with query gets high score
          else if (userObj.name.toLowerCase().startsWith(searchLower)) {
            score += 500;
          }
          // Contains query gets medium score
          else {
            score += 300;
          }
        }
        
        // Priority 2: Roles match
        if (userObj.roles && Array.isArray(userObj.roles)) {
          userObj.roles.forEach(role => {
            if (role.toLowerCase().includes(searchLower)) {
              score += 200;
            }
          });
        }
        
        // Priority 3: Industries match
        if (userObj.industries && Array.isArray(userObj.industries)) {
          userObj.industries.forEach(industry => {
            if (industry.toLowerCase().includes(searchLower)) {
              score += 100;
            }
          });
        }
        
        // Priority 4: Bio match (lowest score)
        if (userObj.bio && userObj.bio.toLowerCase().includes(searchLower)) {
          score += 50;
        }
      }
      
      // Boost score for users matching the selected filters
      // This ensures filtered users appear prominently even without text query
      if (roles) {
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        if (userObj.roles && Array.isArray(userObj.roles)) {
          rolesArray.forEach(filterRole => {
            if (userObj.roles.some(r => r.toLowerCase() === filterRole.toLowerCase())) {
              score += 150; // Boost for exact filter match
            }
          });
        }
      }
      
      if (industries) {
        const industriesArray = Array.isArray(industries) ? industries : [industries];
        if (userObj.industries && Array.isArray(userObj.industries)) {
          industriesArray.forEach(filterIndustry => {
            if (userObj.industries.some(i => i.toLowerCase() === filterIndustry.toLowerCase())) {
              score += 75; // Boost for exact filter match
            }
          });
        }
      }
      
      return { ...userObj, _relevanceScore: score };
    });
    
    // Sort by relevance score (highest first)
    scoredResults.sort((a, b) => b._relevanceScore - a._relevanceScore);
    
    console.log('[User Service] Top 5 scores:', scoredResults.slice(0, 5).map(r => ({ 
      name: r.name, 
      score: r._relevanceScore,
      roles: r.roles?.slice(0, 2),
      industries: r.industries?.slice(0, 2)
    })));
    
    return scoredResults;
  }
  
  return results;
};

module.exports = { getMe, updateMe, getById, search };

