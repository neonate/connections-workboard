# NYT Connections Data Sources Evaluation

**Date:** 2025-01-20  
**Evaluation Version:** 1.0  
**Methodology:** Automated testing with manual verification  

## Executive Summary

After systematically evaluating 5 potential data sources for NYT Connections puzzle data, we identified **Connections Game IO** as the primary recommendation and **Connections Archive** as the backup source.

### Key Findings
- **Highest Score:** 66.5% (Connections Game IO)
- **Average Score:** 53.5% across all sources
- **Recommendation Confidence:** Low (small gap between top sources)
- **Main Challenge:** Limited historical data availability across all sources

## Evaluation Methodology

### Criteria & Weights
1. **Reliability (25%)** - Response success rate and consistency
2. **Data Quality (20%)** - Completeness and accuracy of puzzle data
3. **Historical Coverage (15%)** - Availability of past puzzle data
4. **CORS Compatibility (15%)** - Browser accessibility without proxy
5. **Response Time (10%)** - Speed of API/webpage responses
6. **HTML Stability (10%)** - Consistency of markup structure
7. **Update Frequency (5%)** - How often content is refreshed

### Test Parameters
- **Test Dates:** 2024-08-20, 2024-07-15, 2024-06-01, 2023-12-31, 2023-06-12
- **Reliability Tests:** 5 requests per source
- **Response Time:** 3 measurements averaged
- **Timeout:** 10 seconds per request

## Detailed Source Analysis

### 🥇 1. Connections Game IO (66.5%)
**URL:** https://connectionsgame.io/news/connections-answers

#### Strengths ✅
- **Perfect Reliability:** 100% success rate on all test requests
- **Excellent Performance:** Fast response times (294ms average)
- **Good Structure:** Stable HTML structure for parsing
- **Focused Content:** Dedicated to Connections puzzles

#### Weaknesses ❌
- **Limited Historical Data:** No date-based URL pattern identified
- **CORS Issues:** Requires proxy for browser-based requests
- **Single Page:** Content appears to be on one news page

#### Technical Assessment
```json
{
  "reliability": 1.0,
  "corsCompatibility": 0.5,
  "responseTime": 1.0,
  "historicalCoverage": 0.0,
  "htmlStability": 0.6,
  "dataQuality": 0.7,
  "updateFrequency": 0.8
}
```

### 🥈 2. Connections Archive (62.5%)
**URL:** https://connections.swellgarfo.com/archive

#### Strengths ✅
- **Perfect Reliability:** 100% success rate
- **Fast Response:** Excellent response times (40ms average)
- **Archive Focus:** Designed specifically for historical data

#### Weaknesses ❌
- **Poor HTML Structure:** Minimal structured markup (20% score)
- **Limited Historical Access:** No clear date-based access pattern
- **CORS Issues:** Browser accessibility challenges

#### Technical Assessment
```json
{
  "reliability": 1.0,
  "corsCompatibility": 0.5,
  "responseTime": 1.0,
  "historicalCoverage": 0.0,
  "htmlStability": 0.2,
  "dataQuality": 0.7,
  "updateFrequency": 0.8
}
```

### 🥉 3. Word Tips (56.0%)
**URL:** https://word.tips/todays-nyt-connections-answers/

#### Strengths ✅
- **Good HTML Structure:** Well-structured markup (80% score)
- **Fast Performance:** Excellent response times (67ms average)
- **Multiple URLs:** Supports both answers and hints

#### Weaknesses ❌
- **Moderate Reliability:** 50% success rate on test requests
- **No Historical Pattern:** Date-based URLs don't work
- **Mixed Content:** Not exclusively Connections-focused

#### Technical Assessment
```json
{
  "reliability": 0.5,
  "corsCompatibility": 0.5,
  "responseTime": 1.0,
  "historicalCoverage": 0.0,
  "htmlStability": 0.8,
  "dataQuality": 0.7,
  "updateFrequency": 0.8
}
```

### 4. Times of India (42.0%)
**URL:** https://timesofindia.indiatimes.com/technology/gaming/nyt-connections-hints-and-answers-for-today-{YYYY-MM-DD}.cms

#### Strengths ✅
- **Fast Response:** Good performance (30ms average)
- **Date Pattern:** Has URL pattern for specific dates

#### Weaknesses ❌
- **Zero Reliability:** 0% success rate on test requests
- **Access Issues:** Appears to block automated requests
- **No Historical Data:** Date-based URLs not accessible

### 5. TechRadar (40.5%)
**URL:** https://www.techradar.com/gaming/nyt-connections-today-answers-hints-{YYYY-MM-DD}

#### Strengths ✅
- **Date Pattern:** Has URL pattern for specific dates
- **Fast Base Response:** Good performance when accessible

#### Weaknesses ❌
- **Zero Reliability:** 0% success rate, requests timeout
- **Access Restrictions:** Appears to block automated access
- **No Historical Success:** Date-based URLs not working

## Implementation Recommendations

### Primary Source: Connections Game IO
**Rationale:** Highest overall score with perfect reliability and good performance.

**Implementation Strategy:**
1. **Scraping Approach:** Parse the news/answers page for latest puzzle data
2. **Data Extraction:** Look for structured content with categories and words
3. **Update Frequency:** Check daily for new puzzle posts
4. **Fallback:** Use CORS proxy for browser-based requests

**Risks:**
- Single page format may limit historical data access
- Site structure changes could break parsing
- Rate limiting may be implemented

### Backup Source: Connections Archive
**Rationale:** Second-highest score with perfect reliability, designed for historical data.

**Implementation Strategy:**
1. **Archive Parsing:** Extract historical puzzle data from archive pages
2. **Data Structure:** Parse whatever format the archive uses
3. **Historical Access:** Investigate API or structured data access
4. **Proxy Strategy:** Use CORS proxy for browser access

**Risks:**
- Poor HTML structure may complicate parsing
- Limited update frequency for recent puzzles
- Unofficial nature may affect long-term reliability

### Rejected Sources

#### Word Tips
- **Reason:** Lower reliability (50%) despite good structure
- **Alternative Use:** Could be used for validation/verification
- **Future Consideration:** Monitor for reliability improvements

#### Times of India & TechRadar
- **Reason:** Zero reliability, appear to block automated access
- **Alternative Use:** Manual verification only
- **Future Consideration:** Investigate with different user agents or request patterns

## Technical Implementation Notes

### CORS Handling
All sources require CORS proxy for browser-based access:
- **Recommended Proxy:** `https://api.allorigins.win/get?url=`
- **Fallback Proxy:** `https://cors-anywhere.herokuapp.com/`
- **Custom Solution:** Consider implementing backend proxy if needed

### Rate Limiting Strategy
- **Request Delay:** Minimum 1 second between requests
- **User Agent Rotation:** Rotate between common browser user agents
- **Retry Logic:** Exponential backoff for failed requests
- **Health Monitoring:** Track success rates and adjust accordingly

### Data Validation
All fetched data must be validated against:
- **Structure:** 4 groups with 4 words each
- **Difficulty Levels:** 0-3 (yellow, green, blue, purple)
- **Word Count:** Exactly 16 unique words
- **Category Names:** Non-empty group names

## Future Evaluation Plan

### Monitoring Schedule
- **Weekly:** Automated reliability checks
- **Monthly:** Full evaluation run with updated criteria
- **Quarterly:** Manual verification of data quality

### Trigger Events for Re-evaluation
- **Reliability Drop:** If primary source falls below 80% success rate
- **Site Changes:** If major structural changes detected
- **New Sources:** If new reliable sources are discovered
- **Performance Issues:** If response times exceed 5 seconds consistently

### Success Metrics
- **Target Reliability:** >90% for primary source
- **Target Response Time:** <2 seconds average
- **Target Historical Coverage:** >50% for past 6 months
- **Target Data Quality:** >95% accuracy on manual verification

## Conclusion

While no source achieved an ideal score above 80%, **Connections Game IO** provides the best combination of reliability and performance for a primary implementation. The **Connections Archive** offers a solid backup option with different strengths.

The main challenge across all sources is limited historical data access, which may require:
1. **Incremental Collection:** Build historical database over time
2. **Multiple Source Strategy:** Combine data from multiple sources
3. **Manual Seeding:** Add historical data manually for important dates

**Recommendation:** Proceed with implementation of Connections Game IO as primary source, with Connections Archive as backup, while monitoring for new sources and improvements to existing ones.
