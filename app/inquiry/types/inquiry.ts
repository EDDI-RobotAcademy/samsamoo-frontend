export interface Inquiry {
  id: number;
  title: string;
  content: string;
  answer?: string;
  user_email: string;
  status: "WAIT" | "ANSWERED";
  created_at: string;
  updated_at: string;
}

export interface InquiryCreateRequest {
  title: string;
  content: string;
}

export interface InquiryAnswerRequest {
  answer: string;
}
