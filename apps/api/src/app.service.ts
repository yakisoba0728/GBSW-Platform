import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'GBSW Platform API is running.';
  }

  getHealth() {
    return {
      status: 'ok',
      message: this.getHello(),
    };
  }
}
