# Parser Testing & Validation Guide

## 🎯 Purpose

This guide provides comprehensive tools and processes for safely modifying the TechRadar puzzle parser while preventing regressions.

## 🚨 Critical Protocol: ALWAYS Test Before Committing

**Before making ANY parser changes:**

```bash
# 1. Capture current baseline
npm run test:parser:baseline

# 2. Make your parser changes
# (edit backend/server.js)

# 3. Test for regressions  
npm run test:parser

# 4. Only commit if no regressions detected
```

## 📊 Current Test Results (Baseline)

As of the last baseline capture:

| Date | Status | Issue | Notes |
|------|--------|-------|-------|
| 2024-06-12 | ✅ PASS | None | Complex movie titles (Hedwig edge case) |
| 2024-07-18 | ✅ PASS | None | Standard format, clean baseline |
| **2024-08-21** | ❌ **FAIL** | **Duplicate groups** | **Known issue: TechRadar has duplicate HTML** |
| 2024-06-01 | ✅ PASS | None | Early coverage boundary |
| 2024-11-13 | ✅ PASS | None | November format variations |

**Pass Rate: 4/5 (80%)**

### 🔴 Known Issues

1. **August 21, 2024**: TechRadar HTML contains duplicate sections
   - **Symptoms**: Same groups appear multiple times
   - **Root Cause**: TechRadar's HTML structure has duplicate `<li>` elements
   - **Status**: Needs deduplication logic in parser

## 🛠️ Available Tools

### Quick Commands

```bash
# Test parser against baseline (recommended)
npm run test:parser

# Capture new baseline (when making intentional changes)
npm run test:parser:baseline

# Manual baseline operations
cd test-data/parser-samples
node capture-baseline.js           # Capture baseline
node capture-baseline.js compare   # Compare to baseline
```

### Test Suite Components

- **`capture-baseline.js`**: Core testing script
- **`baseline-data.json`**: Stored baseline results
- **`test-parser-regression.sh`**: Shell wrapper for CI/automation
- **`PARSER_TESTING_GUIDE.md`**: This documentation

## 🔍 What Gets Tested

### Structural Validation
- ✅ Exactly 4 groups per puzzle
- ✅ Exactly 16 words total
- ✅ Each group has exactly 4 words
- ✅ No duplicate groups
- ✅ No duplicate words
- ✅ API success response

### Content Validation
- ✅ Group names match expected patterns
- ✅ Hints are properly extracted
- ✅ Words are correctly parsed and cleaned

## 📋 Parser Change Workflow

### 1. Pre-Change Setup
```bash
# Ensure backend is running
cd backend && node server.js &

# Capture current state
npm run test:parser:baseline
```

### 2. Making Changes
- Edit `backend/server.js`
- Focus on specific functions:
  - `fetchFromTechRadar()`
  - `parseFromHTML()`
  - Hint extraction logic

### 3. Validation
```bash
# Test changes
npm run test:parser

# If regressions detected:
# - Fix issues OR
# - Rollback changes OR  
# - Update baseline if changes are intentional improvements
```

### 4. Commit Process
```bash
# Only commit after clean test results
git add .
git commit -m "Fix parser: description of changes"

# Include test results in commit message
git commit -m "Fix parser: added deduplication logic

Test results: 5/5 tests passing
Fixed: August 21 duplicate groups issue"
```

## 🐛 Debugging Failed Tests

### Common Failure Patterns

1. **Duplicate Groups/Words**
   ```
   Found duplicate groups: GROUP_NAME, GROUP_NAME, ...
   ```
   - **Cause**: HTML contains duplicate sections
   - **Fix**: Add deduplication logic
   - **Example**: August 21, 2024

2. **Wrong Group Count**
   ```
   Expected 4 groups, got X
   ```
   - **Cause**: Parser missing groups or finding extras
   - **Fix**: Check list item filtering logic

3. **Wrong Word Count**
   ```
   Expected 16 words, got X
   ```
   - **Cause**: Word extraction or cleaning issues
   - **Fix**: Check comma-splitting and word cleaning

4. **Group Missing Words**
   ```
   Group X has Y words, expected 4
   ```
   - **Cause**: Parsing logic cutting off words
   - **Fix**: Check content splitting logic

### Debugging Steps

1. **Check Backend Logs**
   ```bash
   # Run individual date and watch logs
   curl "http://localhost:3001/api/fetch-puzzle/YYYY-MM-DD"
   ```

2. **Inspect HTML Structure**
   - Visit TechRadar URL manually
   - Check for format changes
   - Look for duplicate sections

3. **Test Individual Components**
   ```javascript
   // Test hint extraction
   console.log('🔍 Found X hint items');
   
   // Test list parsing  
   console.log('🔍 Found X list items with color pattern');
   ```

## 📈 Adding New Test Cases

When encountering new edge cases:

1. **Add to Known Dates**
   ```javascript
   // In capture-baseline.js
   const KNOWN_WORKING_DATES = [
     // ... existing dates
     {
       date: 'YYYY-MM-DD',
       description: 'Description of edge case',
       expectedGroups: 4,
       expectedWords: 16,
       notes: 'Why this date is important for testing'
     }
   ];
   ```

2. **Re-capture Baseline**
   ```bash
   npm run test:parser:baseline
   ```

3. **Commit Updated Baseline**
   ```bash
   git add test-data/parser-samples/baseline-data.json
   git commit -m "Add new parser test case: YYYY-MM-DD"
   ```

## 🔄 CI/CD Integration

### GitHub Actions Integration (Future)
```yaml
# .github/workflows/parser-tests.yml
- name: Test Parser Regressions
  run: |
    cd backend && node server.js &
    sleep 5
    npm run test:parser
```

### Pre-commit Hooks (Recommended)
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
if [[ $(git diff --cached --name-only) == *"backend/server.js"* ]]; then
  echo "Parser changes detected, running regression tests..."
  npm run test:parser
fi
```

## 📚 Reference

### TechRadar HTML Formats Documented

1. **Standard Format** (Most dates)
   - Clear hint sections without commas
   - Single answer section with 4 groups
   - Consistent `<ul><li>` structure

2. **Duplicate Content** (August 2024)
   - Same data appears multiple times
   - Requires deduplication
   - Different `<div>` sections with identical content

3. **Complex Titles** (June 2024)
   - Multi-word movie/book titles
   - Commas within group names
   - Requires careful parsing logic

### Emergency Procedures

**If tests start failing after deployment:**
1. Check recent commits to `backend/server.js`
2. Rollback to last known good commit
3. Re-run tests to confirm rollback fixed issues
4. Debug original changes in development branch

**If TechRadar changes their format:**
1. Update parsing logic carefully
2. Test extensively with new format
3. Update baseline with confirmed working dates
4. Document new format in this guide

---

*Last Updated: August 22, 2025*  
*Current Baseline: 4/5 tests passing*  
*Known Issues: August 21 duplicate groups*
