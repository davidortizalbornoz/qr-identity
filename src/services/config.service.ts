import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { nanoidConfig } from '../config/nanoid.config';

@Injectable()
export class ConfigService {
  generateId(): string {
    return nanoid(nanoidConfig.size);
  }
}
