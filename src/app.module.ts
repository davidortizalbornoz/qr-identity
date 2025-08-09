import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Identity } from './entities/identity.entity';
import { databaseConfig } from './config/database.config';
import { S3Service } from './services/s3.service';
import { ConfigService } from './services/config.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Identity]),
  ],
  controllers: [AppController],
  providers: [AppService, S3Service, ConfigService],
})
export class AppModule {}
