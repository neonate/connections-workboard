# Parser Testing and Validation

This directory contains comprehensive testing and validation tools for the NYT Connections puzzle parser.

## Overview

Our parser has evolved from complex text-based parsing to a more reliable **HTML structure-based parsing approach**. This approach leverages the actual HTML structure of TechRadar articles to correctly separate category names from puzzle words.

## Testing Strategy

### 1. HTML Structure Parsing Tests (`test-html-parsing.js`)

**Purpose**: Tests the core HTML-based parsing logic that separates categories from words using HTML structure.

**Key Tests**:
- **BRAKE FLUID Separation** (2025-08-23): Ensures "LIQUIDS YOU PUT INTO CARS" is correctly separated from "BRAKE FLUID"
- **Complex Movie Titles** (2024-06-12): Tests parsing of "HEDWIG AND THE ANGRY INCH" vs category "ENDING IN UNITS OF MEASUREMENT"
- **Compound Names** (2025-08-22): Validates handling of "CHEVY CHASE" as a single word

**How It Works**:
- Uses HTML `<strong>` tags to identify category boundaries
- Extracts category names from inside `<strong>` tags
- Extracts puzzle words from after `</strong>` tags
- No more complex text parsing or concatenation issues

### 2. Baseline Regression Tests (`capture-baseline.js`)

**Purpose**: Comprehensive regression testing across multiple dates to ensure parser stability.

**Test Dates**:
- 2024-06-01: Early coverage boundary
- 2024-06-12: Complex movie titles
- 2024-07-18: Standard format validation
- 2024-08-21: Duplicate HTML handling
- 2024-11-13: Different seasonal layouts
- 2025-03-06: Hint vs category separation
- 2025-08-22: Compound proper names
- 2025-08-23: Compound word separation

**Validation Logic**:
- Basic structure validation (4 groups, 16 words)
- Duplicate detection
- HTML parsing specific checks:
  - Category names are clean (no concatenated words)
  - Words don't start with category fragments
  - Reasonable length constraints
  - No old parsing artifacts

### 3. Cross-Source Validation (`test-cross-source-validation.js`)

**Purpose**: Tests data consistency between different puzzle sources.

## Running Tests

### HTML Parsing Tests
```bash
cd tests/integration
node test-html-parsing.js
```

### Baseline Regression Tests
```bash
cd tests/integration
node capture-baseline.js
```

### Cross-Source Validation
```bash
cd tests/integration
node test-cross-source-validation.js
```

## What Changed

### Before (Old Text Parser)
- Complex regex-based text parsing
- Category names and words were concatenated
- Examples of issues:
  - "LIQUIDS YOU PUT INTO CARS BRAKE" + ["FLUID", "COOLANT", "FUEL", "OIL"]
  - "ENDING IN UNITS OF MEASUREMENT HEDWIG AND THE ANGRY" + ["INCH", "MY LEFT FOOT", ...]

### After (New HTML Parser)
- HTML structure-based parsing using `<strong>` tags
- Clean separation of categories and words
- Examples of correct parsing:
  - "LIQUIDS YOU PUT INTO CARS" + ["BRAKE FLUID", "COOLANT", "FUEL", "OIL"]
  - "ENDING IN UNITS OF MEASUREMENT" + ["HEDWIG AND THE ANGRY INCH", "MY LEFT FOOT", ...]

## Test Data

- `baseline-data.json`: Current baseline with new HTML parsing results
- `cross-source-validation-results.json`: Cross-source validation results
- `toi-samples.js`: Times of India parser test samples

## Environment Support

Tests support multiple environments:
- Local development: `http://localhost:3001`
- Custom backend: `BACKEND_URL` environment variable
- DigitalOcean: `DIGITALOCEAN_APP_URL` environment variable

## Continuous Integration

These tests are designed to run in CI/CD pipelines and can be integrated with:
- GitHub Actions
- Pre-commit hooks
- Automated deployment validation

## Troubleshooting

If tests fail:
1. Check backend server status
2. Verify network connectivity to TechRadar
3. Review server logs for parsing errors
4. Check if HTML structure has changed on TechRadar
5. Validate test data format matches current parser expectations
