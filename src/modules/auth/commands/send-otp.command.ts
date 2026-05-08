import { CountryCode } from "libphonenumber-js";
import { IdentifierType } from "@/modules/auth/enums/identifier-type.enum";

export interface SendOtpCommand {
    identifierType: IdentifierType,
    identifier: string,
    countryCode?: CountryCode,
}