import { CountryCode } from "node_modules/libphonenumber-js/types.cjs";
import { UserRole, UserStatus } from "../enums";

export interface CreateUserCommand {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    countryCode: CountryCode,
    role?: UserRole,
    status?: UserStatus,
}