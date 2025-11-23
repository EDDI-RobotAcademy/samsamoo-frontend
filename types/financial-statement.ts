export interface FinancialStatement {
    id: number;
    user_id: number;
    company_name: string;
    statement_type: "quarterly" | "annual";
    fiscal_year: number;
    fiscal_quarter?: number;
    pdf_s3_key?: string;
    status: "metadata_only" | "pdf_uploaded" | "ratios_calculated" | "analysis_complete";
    created_at: string;
    updated_at: string;
}

export interface FinancialRatio {
    id: number;
    statement_id: number;
    category: string;
    ratio_name: string;
    value: number;
    description?: string;
    created_at: string;
}

export interface AnalysisReport {
    id: number;
    statement_id: number;
    summary: string;
    insights: string[];
    recommendations: string[];
    report_s3_key: string;
    created_at: string;
}

export interface AnalysisResult {
    statement: FinancialStatement;
    ratios: FinancialRatio[];
    report: AnalysisReport;
    report_pdf_url: string;
}

export interface CreateStatementRequest {
    company_name: string;
    statement_type: "quarterly" | "annual";
    fiscal_year: number;
    fiscal_quarter?: number;
}

export interface PaginatedStatements {
    items: FinancialStatement[];
    total: number;
    page: number;
    size: number;
    pages: number;
}
