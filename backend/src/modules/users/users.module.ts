import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';
import { User, UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, ShopsController],
  providers: [UsersService, ShopsService],
  // MongooseModule is re-exported so bootstrap-time consumers (admin seed)
  // can inject the User model without importing the schema directly.
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
