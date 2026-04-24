import { CountryCode } from "libphonenumber-js";
import { IdentifierType } from "../enums/identifier-type.enum";

export interface LoginUserCommand {
    identifierType: IdentifierType,
    identifier: string,
    password: string,
    countryCode?: CountryCode,
}