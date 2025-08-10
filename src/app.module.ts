import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { Identity } from './entities/identity.entity';
import { databaseConfig } from './config/database.config';
import { S3Service } from './services/s3.service';
import { NanoIDConfigService } from './services/nanoid.config.service';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Identity]),
  ],
  controllers: [AppController],
  providers: [AppService, S3Service, NanoIDConfigService],
})
export class AppModule {}
