export interface AnonymousBoard {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAnonymousBoardRequest {
    title: string;
    content: string;
}
