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
    ratio_type: string;
    ratio_value: string; // Formatted as percentage string (e.g., "15.5%")
    calculated_at: string;
}

export interface AnalysisReport {
    id: number;
    statement_id: number;
    kpi_summary: string | null;
    statement_table_summary: Record<string, any> | null;
    ratio_analysis: string | null;
    report_s3_key: string | null;
    is_complete: boolean;
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
