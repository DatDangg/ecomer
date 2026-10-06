import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService],
  // MongooseModule is re-exported so bootstrap-time consumers (admin seed)
  // can inject the User model without importing the schema directly.
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
