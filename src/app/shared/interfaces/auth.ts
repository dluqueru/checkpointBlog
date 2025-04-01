export interface loginResponse{
    token: string;
}

export interface RegisterResponse{
    message: string;
}

export interface User{
    username: string;
    password: string
}

export interface CheckEmailResponse {
    exists: boolean;
}

export interface Token {
    iat: number;
    exp: number;
    username: string;
    role: string;
}