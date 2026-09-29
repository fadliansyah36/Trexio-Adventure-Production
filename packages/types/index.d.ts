export interface ApiError { detail?: string; code?: string; }
export interface ApiResponse<T> { data: T; status: number; }
export type Id = string;
