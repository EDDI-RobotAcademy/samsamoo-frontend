/**
 * XBRL Analysis Types
 * TypeScript interfaces for XBRL document analysis and financial ratio calculations
 */

// Financial data extracted from XBRL
// Field names aligned with backend xbrl_extraction_service.py
export interface BalanceSheet {
    // Assets
    total_assets?: number;
    current_assets?: number;
    non_current_assets?: number;
    cash?: number;                    // Backend sends 'cash', not 'cash_and_equivalents'
    cash_and_equivalents?: number;    // Keep for backwards compatibility
    inventory?: number;
    trade_receivables?: number;       // Backend sends 'trade_receivables'
    receivables?: number;             // Keep for backwards compatibility

    // Liabilities
    total_liabilities?: number;
    current_liabilities?: number;
    non_current_liabilities?: number;
    trade_payables?: number;

    // Equity
    total_equity?: number;
    share_capital?: number;
    retained_earnings?: number;
}

export interface IncomeStatement {
    revenue?: number;
    cost_of_sales?: number;
    gross_profit?: number;
    operating_income?: number;
    operating_expenses?: number;
    interest_expense?: number;
    interest_income?: number;
    income_before_tax?: number;
    income_tax_expense?: number;
    net_income?: number;
    eps?: number;
    ebitda?: number;                  // May be calculated
}

export interface CashFlowStatement {
    operating_cash_flow?: number;
    investing_cash_flow?: number;
    financing_cash_flow?: number;
    net_cash_flow?: number;           // Backend sends 'net_cash_flow'
    net_cash_change?: number;         // Keep for backwards compatibility
    capex?: number;                   // Backend sends 'capex'
    capital_expenditure?: number;     // Keep for backwards compatibility
    depreciation?: number;
    amortization?: number;
    beginning_cash?: number;
    ending_cash?: number;
    dividends_paid?: number;
    free_cash_flow?: number;          // May be calculated
}

export interface FinancialData {
    balance_sheet: BalanceSheet;
    income_statement: IncomeStatement;
    cash_flow?: CashFlowStatement;              // Optional - may not always be present
    cash_flow_statement?: CashFlowStatement;    // Backend may send this name
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

// Financial health assessment from LLM
export interface FinancialHealthAssessment {
    overall_score: number;
    rating: string;
    strengths: string[];
    weaknesses: string[];
    key_risks: string[];
    improvement_areas: string[];
    summary: string;
}

// Investment recommendation from LLM
export interface InvestmentRecommendation {
    recommendation: string;
    confidence: string;
    target_investor: string;
    time_horizon: string;
    key_positives: string[];
    key_negatives: string[];
    catalysts: string[];
    summary: string;
}

// LLM Analysis result
export interface LLMAnalysis {
    corp_name?: string;
    fiscal_year?: number;
    analysis_date?: string;
    executive_summary: string;
    financial_health: FinancialHealthAssessment;
    ratio_analysis: string;
    investment_recommendation: InvestmentRecommendation;
    // Keep old names for backwards compatibility
    recommendations?: string;
    risk_assessment?: string;
    industry_comparison?: string;
    raw_data?: {
        financial_data: FinancialData;
        ratios: { type: string; value: number }[];
        benchmarks: Record<string, number>;
    };
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
