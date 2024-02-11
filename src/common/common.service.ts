import { Injectable } from '@nestjs/common';
import { v5 as uuidv5 } from 'uuid';

@Injectable()
export class CommonService {
  public async generateUUID(input: any) {
    return uuidv5(input, '1b671a64-40d5-491e-99b0-da01ff1f3341').replace(
      /-/g,
      '',
    );
  }
}
