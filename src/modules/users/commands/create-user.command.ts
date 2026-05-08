import { CountryCode } from "libphonenumber-js";
import { UserStatus, UserType } from "@/modules/users/enums";

export interface CreateUserCommand {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    countryCode: CountryCode,
    roleId?: string,
    userType?: UserType,
    status?: UserStatus,
}