import { CountryCode } from "libphonenumber-js";
import { IdentifierType } from "@/modules/auth/enums/identifier-type.enum";

export interface ForgotPasswordUserCommand {
    identifierType: IdentifierType,
    identifier: string,
    countryCode?: CountryCode,
}