import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from '../../config/configuration';
import { validate } from '../../config/env.validation';
import {
  Category,
  CategorySchema,
} from '../../modules/categories/category.schema';
import { Product, ProductSchema } from '../../modules/products/product.schema';
import { User, UserSchema } from '../../modules/users/user.schema';
import { DatabaseModule } from '../database.module';
import { SampleSeedService } from './sample-seed.service';

/**
 * Standalone context for the manual `seed:sample` runner. It intentionally
 * boots neither `AppModule` nor `AdminSeedService`, so seeding sample data
 * never touches auth and only needs the three models it writes.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [SampleSeedService],
})
export class SampleSeedModule {}
