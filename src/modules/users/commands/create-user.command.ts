import { CountryCode } from "node_modules/libphonenumber-js/types.cjs";
import { UserStatus } from "../enums";

export interface CreateUserCommand {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    countryCode: CountryCode,
    roleId?: string,
    status?: UserStatus,
}