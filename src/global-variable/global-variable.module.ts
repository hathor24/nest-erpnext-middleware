import { Module } from '@nestjs/common';
// import { GlobalVariableService } from './global-variable.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  // providers: [GlobalVariableService],
})
export class GlobalVariableModule {}
