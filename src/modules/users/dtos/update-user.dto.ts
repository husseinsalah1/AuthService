import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@/modules/users/dtos/create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}