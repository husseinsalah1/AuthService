export interface JwtPayload {
    sub: string,
    email: string,
    phoneNumber: string,
    countryCode: string,
    role: string,
    iat?: number,
    exp?: number
}