import { CountryCode } from "libphonenumber-js";
import { IdentifierType } from "../enums/identifier-type.enum";

export interface ForgotPasswordUserCommand {
    identifierType: IdentifierType,
    identifier: string,
    countryCode?: CountryCode,
}