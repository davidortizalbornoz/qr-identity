import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { nanoidConfig } from '../config/nanoid.config';

@Injectable()
export class NanoIDConfigService {
  generateId(): string {
    return nanoid(nanoidConfig.size);
  }

  generateIds(count: number): string[] {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(nanoid(nanoidConfig.size));
    }
    return ids;
  }

  getNanoidConfig() {
    return nanoidConfig;
  }
}
