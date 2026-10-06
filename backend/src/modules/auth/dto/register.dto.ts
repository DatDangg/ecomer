import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MaxUtf8Bytes } from '../../../common/validators/max-utf8-bytes.decorator';

/**
 * Public registration body. `role`/`isActive` are intentionally absent so the
 * global whitelist pipe rejects them: public accounts are always `customer`
 * (docs/PERMISSION.md, mass-assignment guard).
 */
export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  // bcrypt only hashes the first 72 bytes, so validate bytes (not characters).
  @MaxUtf8Bytes(72)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;
}
