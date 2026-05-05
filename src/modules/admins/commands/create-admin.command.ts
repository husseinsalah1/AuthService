import { CountryCode } from "libphonenumber-js";
import { UserStatus, UserType } from "../../users/enums";

export interface CreateAdminCommand {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string,
    countryCode: CountryCode,
    roleId: string,
    userType?: UserType,
    status?: UserStatus,
}