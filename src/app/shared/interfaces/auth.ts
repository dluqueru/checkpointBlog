export interface loginResponse{
    token: string;
}

export interface User{
    username: string,
    name: string,
    email: string,
    photo: string,
    password: string
}

export interface RegisterResponse{
    username: string,
    name: string,
    email: string,
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