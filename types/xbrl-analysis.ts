/**
 * XBRL Analysis Types
 * TypeScript interfaces for XBRL document analysis and financial ratio calculations
 */

// Financial data extracted from XBRL
export interface BalanceSheet {
    total_assets?: number;
    total_liabilities?: number;
    total_equity?: number;
    current_assets?: number;
    current_liabilities?: number;
    non_current_assets?: number;
    non_current_liabilities?: number;
    cash_and_equivalents?: number;
    inventory?: number;
    receivables?: number;
    retained_earnings?: number;
}

export interface IncomeStatement {
    revenue?: number;
    cost_of_sales?: number;
    gross_profit?: number;
    operating_income?: number;
    net_income?: number;
    operating_expenses?: number;
    interest_expense?: number;
    income_tax_expense?: number;
    ebitda?: number;
}

export interface CashFlowStatement {
    operating_cash_flow?: number;
    investing_cash_flow?: number;
    financing_cash_flow?: number;
    net_cash_change?: number;
    capital_expenditure?: number;
    dividends_paid?: number;
    free_cash_flow?: number;
}

export interface FinancialData {
    balance_sheet: BalanceSheet;
    income_statement: IncomeStatement;
    cash_flow: CashFlowStatement;
}

// Calculated financial ratios
export interface XBRLRatio {
    type: string;
    value: number;
    formatted: string;
    category: 'profitability' | 'liquidity' | 'leverage' | 'efficiency' | 'other';
}

// Validation results
export interface XBRLValidation {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    missing_required: string[];
}

// Document metadata
export interface XBRLMetadata {
    fact_count: number;
    context_count: number;
    taxonomy: string;
    available_concepts?: number;
    unit_count?: number;
}

// XBRL Concept (for debugging/raw parse)
export interface XBRLConcept {
    concept: string;
    namespace: string;
    local_name: string;
    has_numeric_value: boolean;
    sample_value: string;
}

// LLM Analysis result
export interface LLMAnalysis {
    executive_summary: string;
    financial_health: string;
    ratio_analysis: string;
    recommendations: string;
    risk_assessment?: string;
    industry_comparison?: string;
}

// Main analysis response
export interface XBRLAnalysisResult {
    status: 'success' | 'error';
    corp_name: string;
    fiscal_year: number;
    source: 'upload' | 'dart';
    filename?: string;
    financial_data: FinancialData;
    ratios: XBRLRatio[];
    validation: XBRLValidation;
    metadata: XBRLMetadata;
    analysis?: LLMAnalysis;
    analysis_error?: string;
}

// Quick ratios response
export interface XBRLRatiosResult {
    status: 'success' | 'error';
    corp_name: string;
    fiscal_year: number;
    filename?: string;
    ratios: XBRLRatio[];
    summary: {
        total_assets?: number;
        total_equity?: number;
        revenue?: number;
        net_income?: number;
    };
}

// Parse response (debugging)
export interface XBRLParseResult {
    status: 'success' | 'error';
    filename?: string;
    financial_data: FinancialData;
    validation: XBRLValidation;
    metadata: XBRLMetadata;
    concepts?: XBRLConcept[];
}

// Corporation search result (from DART)
export interface CorporationInfo {
    corp_code: string;
    corp_name: string;
    stock_code?: string;
    modify_date?: string;
}

// Health check response
export interface XBRLHealthCheck {
    status: 'healthy' | 'unhealthy';
    service: string;
    configuration: {
        dart_api_key: 'configured' | 'missing';
        llm_provider: 'openai' | 'anthropic' | 'template';
    };
    capabilities: {
        quick_analysis: boolean;
        full_analysis: boolean;
        historical_analysis: boolean;
        comparison: boolean;
    };
}
