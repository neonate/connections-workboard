#!/usr/bin/env node

/**
 * NYT Connections Data Sources Evaluation Script
 * 
 * This script systematically evaluates all potential data sources for fetching
 * NYT Connections puzzle data. It tests for reliability, data quality, 
 * historical coverage, CORS compatibility, and performance.
 * 
 * Usage:
 *   node scripts/evaluate-data-sources.js
 *   node scripts/evaluate-data-sources.js --source wordtips
 *   node scripts/evaluate-data-sources.js --verbose --output evaluation-results.json
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

/**
 * Data sources to evaluate
 */
const DATA_SOURCES = {
  wordTips: {
    name: 'Word Tips',
    baseUrl: 'https://word.tips',
    todayUrl: 'https://word.tips/todays-nyt-connections-answers/',
    hintsUrl: 'https://word.tips/connections-hints-today/',
    dateUrlPattern: 'https://word.tips/connections-answers-{YYYY-MM-DD}/',
    description: 'Daily NYT Connections answers and hints from Word Tips',
    corsProxy: false
  },
  timesOfIndia: {
    name: 'Times of India',
    baseUrl: 'https://timesofindia.indiatimes.com',
    dateUrlPattern: 'https://timesofindia.indiatimes.com/technology/gaming/nyt-connections-hints-and-answers-for-today-{YYYY-MM-DD}.cms',
    description: 'Daily NYT Connections coverage from Times of India',
    corsProxy: false
  },
  techRadar: {
    name: 'TechRadar',
    baseUrl: 'https://www.techradar.com',
    dateUrlPattern: 'https://www.techradar.com/gaming/nyt-connections-today-answers-hints-{YYYY-MM-DD}',
    description: 'Daily NYT Connections coverage from TechRadar',
    corsProxy: false
  },
  connectionsGame: {
    name: 'Connections Game IO',
    baseUrl: 'https://connectionsgame.io',
    newsUrl: 'https://connectionsgame.io/news/connections-answers',
    description: 'Connections game news and answers',
    corsProxy: false
  },
  connectionsArchive: {
    name: 'Connections Archive',
    baseUrl: 'https://connections.swellgarfo.com',
    archiveUrl: 'https://connections.swellgarfo.com/archive',
    description: 'Unofficial archive of NYT Connections answers',
    corsProxy: false
  }
};

/**
 * Evaluation criteria weights
 */
const EVALUATION_CRITERIA = {
  reliability: 0.25,          // Response success rate
  dataQuality: 0.20,          // Completeness and accuracy of data
  historicalCoverage: 0.15,   // How far back data goes
  corsCompatibility: 0.15,    // CORS headers and accessibility
  responseTime: 0.10,         // Speed of responses
  htmlStability: 0.10,        // Consistency of HTML structure
  updateFrequency: 0.05       // How often data is updated
};

/**
 * Test dates to use for evaluation
 */
const TEST_DATES = [
  '2024-08-20', // Recent date
  '2024-07-15', // Month back
  '2024-06-01', // Few months back
  '2023-12-31', // Last year
  '2023-06-12'  // Launch date
];

class DataSourceEvaluator {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.outputFile = options.outputFile || null;
    this.corsProxyUrl = options.corsProxy || 'https://api.allorigins.win/get?url=';
    this.results = {};
    this.startTime = performance.now();
  }

  /**
   * Main evaluation function
   */
  async evaluate(sourceName = null) {
    this.log('🔍 Starting NYT Connections data source evaluation...\n');

    const sourcesToEvaluate = sourceName 
      ? { [sourceName]: DATA_SOURCES[sourceName] }
      : DATA_SOURCES;

    if (sourceName && !sourcesToEvaluate[sourceName]) {
      throw new Error(`Unknown data source: ${sourceName}`);
    }

    for (const [key, source] of Object.entries(sourcesToEvaluate)) {
      this.log(`📊 Evaluating: ${source.name}`);
      this.results[key] = await this.evaluateSource(key, source);
      this.log(`✅ Completed: ${source.name}\n`);
    }

    const analysis = this.analyzeResults();
    await this.generateReport(analysis);

    const totalTime = ((performance.now() - this.startTime) / 1000).toFixed(2);
    this.log(`🎉 Evaluation completed in ${totalTime}s`);

    return analysis;
  }

  /**
   * Evaluate a single data source
   */
  async evaluateSource(key, source) {
    const result = {
      name: source.name,
      description: source.description,
      baseUrl: source.baseUrl,
      timestamp: new Date().toISOString(),
      scores: {},
      details: {},
      errors: []
    };

    try {
      // Test reliability (response success rate)
      result.scores.reliability = await this.testReliability(source);
      
      // Test CORS compatibility
      result.scores.corsCompatibility = await this.testCorsCompatibility(source);
      
      // Test response time
      result.scores.responseTime = await this.testResponseTime(source);
      
      // Test historical coverage
      result.scores.historicalCoverage = await this.testHistoricalCoverage(source);
      
      // Test HTML structure stability
      result.scores.htmlStability = await this.testHtmlStability(source);
      
      // For now, assign default scores for criteria we can't fully test programmatically
      result.scores.dataQuality = 0.7; // Will need manual verification
      result.scores.updateFrequency = 0.8; // Will need manual verification

      // Calculate overall score
      result.overallScore = this.calculateOverallScore(result.scores);

    } catch (error) {
      result.errors.push(`Evaluation failed: ${error.message}`);
      result.overallScore = 0;
    }

    return result;
  }

  /**
   * Test reliability by making multiple requests
   */
  async testReliability(source) {
    this.verbose && this.log('  Testing reliability...');
    
    let successCount = 0;
    const totalTests = 5;
    const testUrls = [];

    // Prepare test URLs
    if (source.todayUrl) testUrls.push(source.todayUrl);
    if (source.hintsUrl) testUrls.push(source.hintsUrl);
    if (source.newsUrl) testUrls.push(source.newsUrl);
    if (source.archiveUrl) testUrls.push(source.archiveUrl);
    
    // Add date-based URLs if pattern exists
    if (source.dateUrlPattern) {
      testUrls.push(
        source.dateUrlPattern.replace('{YYYY-MM-DD}', '2024-08-15'),
        source.dateUrlPattern.replace('{YYYY-MM-DD}', '2024-07-20')
      );
    }

    // Test each URL
    for (let i = 0; i < Math.min(totalTests, testUrls.length); i++) {
      try {
        const response = await this.makeRequest(testUrls[i]);
        if (response.statusCode >= 200 && response.statusCode < 400) {
          successCount++;
        }
      } catch (error) {
        this.verbose && this.log(`    Failed: ${testUrls[i]} - ${error.message}`);
      }
    }

    const reliabilityScore = testUrls.length > 0 ? successCount / Math.min(totalTests, testUrls.length) : 0;
    this.verbose && this.log(`    Reliability: ${(reliabilityScore * 100).toFixed(1)}%`);
    
    return reliabilityScore;
  }

  /**
   * Test CORS compatibility
   */
  async testCorsCompatibility(source) {
    this.verbose && this.log('  Testing CORS compatibility...');
    
    const testUrl = source.todayUrl || source.newsUrl || source.archiveUrl || source.baseUrl;
    if (!testUrl) return 0;

    try {
      const response = await this.makeRequest(testUrl);
      const headers = response.headers || {};
      
      let score = 0;
      
      // Check for CORS headers
      if (headers['access-control-allow-origin']) {
        score += 0.4;
      }
      if (headers['access-control-allow-methods']) {
        score += 0.3;
      }
      if (headers['access-control-allow-headers']) {
        score += 0.3;
      }
      
      // If no CORS headers, check if request succeeds anyway
      if (score === 0 && response.statusCode >= 200 && response.statusCode < 400) {
        score = 0.5; // Partial score for working without explicit CORS
      }

      this.verbose && this.log(`    CORS Score: ${(score * 100).toFixed(1)}%`);
      return score;
      
    } catch (error) {
      this.verbose && this.log(`    CORS test failed: ${error.message}`);
      return 0;
    }
  }

  /**
   * Test response time
   */
  async testResponseTime(source) {
    this.verbose && this.log('  Testing response time...');
    
    const testUrl = source.todayUrl || source.newsUrl || source.archiveUrl || source.baseUrl;
    if (!testUrl) return 0;

    const times = [];
    const testCount = 3;

    for (let i = 0; i < testCount; i++) {
      try {
        const startTime = performance.now();
        await this.makeRequest(testUrl);
        const endTime = performance.now();
        times.push(endTime - startTime);
      } catch (error) {
        // Ignore errors, just measure successful requests
      }
    }

    if (times.length === 0) return 0;

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    
    // Score based on response time (lower is better)
    // < 1000ms = 1.0, < 2000ms = 0.8, < 3000ms = 0.6, < 5000ms = 0.4, else 0.2
    let score = 0.2;
    if (avgTime < 1000) score = 1.0;
    else if (avgTime < 2000) score = 0.8;
    else if (avgTime < 3000) score = 0.6;
    else if (avgTime < 5000) score = 0.4;

    this.verbose && this.log(`    Avg Response Time: ${avgTime.toFixed(0)}ms (Score: ${(score * 100).toFixed(1)}%)`);
    return score;
  }

  /**
   * Test historical coverage
   */
  async testHistoricalCoverage(source) {
    this.verbose && this.log('  Testing historical coverage...');
    
    if (!source.dateUrlPattern) return 0;

    let foundData = 0;
    const totalTests = TEST_DATES.length;

    for (const date of TEST_DATES) {
      try {
        const url = source.dateUrlPattern.replace('{YYYY-MM-DD}', date);
        const response = await this.makeRequest(url);
        
        if (response.statusCode >= 200 && response.statusCode < 400) {
          foundData++;
        }
      } catch (error) {
        // Expected for older dates
      }
    }

    const coverage = foundData / totalTests;
    this.verbose && this.log(`    Historical Coverage: ${foundData}/${totalTests} dates (${(coverage * 100).toFixed(1)}%)`);
    return coverage;
  }

  /**
   * Test HTML structure stability
   */
  async testHtmlStability(source) {
    this.verbose && this.log('  Testing HTML structure...');
    
    const testUrl = source.todayUrl || source.newsUrl || source.archiveUrl;
    if (!testUrl) return 0.5; // Default score if no testable URL

    try {
      const response = await this.makeRequest(testUrl);
      const html = response.body || '';
      
      let score = 0;
      
      // Look for common HTML patterns that indicate structure
      const patterns = [
        /<h[1-6][^>]*>/i,     // Headers
        /<p[^>]*>/i,          // Paragraphs  
        /<div[^>]*>/i,        // Divs
        /<article[^>]*>/i,    // Articles
        /<section[^>]*>/i     // Sections
      ];
      
      patterns.forEach(pattern => {
        if (pattern.test(html)) score += 0.2;
      });

      this.verbose && this.log(`    HTML Structure Score: ${(score * 100).toFixed(1)}%`);
      return score;
      
    } catch (error) {
      this.verbose && this.log(`    HTML test failed: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate overall score based on weighted criteria
   */
  calculateOverallScore(scores) {
    let totalScore = 0;
    for (const [criterion, weight] of Object.entries(EVALUATION_CRITERIA)) {
      totalScore += (scores[criterion] || 0) * weight;
    }
    return totalScore;
  }

  /**
   * Analyze results and rank sources
   */
  analyzeResults() {
    const analysis = {
      timestamp: new Date().toISOString(),
      sources: this.results,
      ranking: [],
      recommendations: {
        primary: null,
        backup: null
      },
      summary: {}
    };

    // Create ranking
    analysis.ranking = Object.entries(this.results)
      .map(([key, result]) => ({
        key,
        name: result.name,
        score: result.overallScore,
        strengths: this.identifyStrengths(result),
        weaknesses: this.identifyWeaknesses(result)
      }))
      .sort((a, b) => b.score - a.score);

    // Set recommendations
    if (analysis.ranking.length > 0) {
      analysis.recommendations.primary = analysis.ranking[0];
      analysis.recommendations.backup = analysis.ranking[1] || null;
    }

    // Generate summary statistics
    const scores = analysis.ranking.map(r => r.score);
    analysis.summary = {
      totalSources: scores.length,
      highestScore: Math.max(...scores, 0),
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      recommendationsConfidence: this.calculateConfidence(analysis.ranking)
    };

    return analysis;
  }

  /**
   * Identify strengths of a source
   */
  identifyStrengths(result) {
    const strengths = [];
    const scores = result.scores;

    if (scores.reliability > 0.8) strengths.push('High reliability');
    if (scores.corsCompatibility > 0.7) strengths.push('Good CORS support');
    if (scores.responseTime > 0.8) strengths.push('Fast response times');
    if (scores.historicalCoverage > 0.6) strengths.push('Good historical coverage');
    if (scores.htmlStability > 0.7) strengths.push('Stable HTML structure');

    return strengths;
  }

  /**
   * Identify weaknesses of a source
   */
  identifyWeaknesses(result) {
    const weaknesses = [];
    const scores = result.scores;

    if (scores.reliability < 0.5) weaknesses.push('Low reliability');
    if (scores.corsCompatibility < 0.3) weaknesses.push('Poor CORS support');
    if (scores.responseTime < 0.5) weaknesses.push('Slow response times');
    if (scores.historicalCoverage < 0.3) weaknesses.push('Limited historical data');
    if (scores.htmlStability < 0.5) weaknesses.push('Unstable HTML structure');

    return weaknesses;
  }

  /**
   * Calculate confidence in recommendations
   */
  calculateConfidence(ranking) {
    if (ranking.length < 2) return 'Low';
    
    const topScore = ranking[0].score;
    const secondScore = ranking[1].score;
    
    const gap = topScore - secondScore;
    
    if (gap > 0.2) return 'High';
    if (gap > 0.1) return 'Medium';
    return 'Low';
  }

  /**
   * Generate evaluation report
   */
  async generateReport(analysis) {
    const report = this.formatReport(analysis);
    
    console.log(report);
    
    if (this.outputFile) {
      await fs.writeFile(this.outputFile, JSON.stringify(analysis, null, 2));
      this.log(`\n📄 Detailed results saved to: ${this.outputFile}`);
    }
  }

  /**
   * Format report for console output
   */
  formatReport(analysis) {
    let report = '\n' + '='.repeat(80) + '\n';
    report += '🏆 DATA SOURCE EVALUATION RESULTS\n';
    report += '='.repeat(80) + '\n\n';

    // Summary
    report += `📊 SUMMARY:\n`;
    report += `   Sources Evaluated: ${analysis.summary.totalSources}\n`;
    report += `   Highest Score: ${(analysis.summary.highestScore * 100).toFixed(1)}%\n`;
    report += `   Average Score: ${(analysis.summary.averageScore * 100).toFixed(1)}%\n`;
    report += `   Recommendation Confidence: ${analysis.summary.recommendationsConfidence}\n\n`;

    // Rankings
    report += `🥇 RANKINGS:\n`;
    analysis.ranking.forEach((source, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      report += `   ${medal} ${source.name}: ${(source.score * 100).toFixed(1)}%\n`;
      
      if (source.strengths.length > 0) {
        report += `      ✅ ${source.strengths.join(', ')}\n`;
      }
      if (source.weaknesses.length > 0) {
        report += `      ❌ ${source.weaknesses.join(', ')}\n`;
      }
      report += '\n';
    });

    // Recommendations
    report += `💡 RECOMMENDATIONS:\n`;
    if (analysis.recommendations.primary) {
      report += `   Primary Source: ${analysis.recommendations.primary.name}\n`;
      report += `   Score: ${(analysis.recommendations.primary.score * 100).toFixed(1)}%\n\n`;
    }
    
    if (analysis.recommendations.backup) {
      report += `   Backup Source: ${analysis.recommendations.backup.name}\n`;
      report += `   Score: ${(analysis.recommendations.backup.score * 100).toFixed(1)}%\n\n`;
    }

    return report;
  }

  /**
   * Make HTTP request with timeout
   */
  makeRequest(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      const req = client.get(url, {
        timeout: timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }, (res) => {
        let body = '';
        
        res.on('data', chunk => {
          body += chunk.toString();
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Log with optional verbose mode
   */
  log(message) {
    console.log(message);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose'),
    outputFile: null
  };

  let sourceName = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      sourceName = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputFile = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] && !args[i].startsWith('--') && !sourceName) {
      sourceName = args[i];
    }
  }

  const evaluator = new DataSourceEvaluator(options);
  
  evaluator.evaluate(sourceName)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Evaluation failed:', error.message);
      process.exit(1);
    });
}

module.exports = DataSourceEvaluator;
