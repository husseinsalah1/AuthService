import { CountryCode } from "libphonenumber-js";
import { IdentifierType } from "../enums/identifier-type.enum";

export interface VerifyOtpCommand {
    identifierType: IdentifierType,
    identifier: string,
    countryCode?: CountryCode,
    code: string
}