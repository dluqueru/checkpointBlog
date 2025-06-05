export interface LoginResponse{
    token: string;
}

export interface User{
    username: string,
    name: string,
    email: string,
    photo: string,
    password: string,
    imagePublicId?: string;
}

export interface UserResponse{
    username: string,
    name: string,
    email: string,
    photo: string,
    role: string,
    reputation: number
}

export interface RegisterResponse{
    username: string,
    name: string,
    email: string,
    photo?: string,
    role: string
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