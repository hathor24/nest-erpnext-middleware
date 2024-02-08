import { Controller } from '@nestjs/common';
import { ManufacturersService } from './manufacturers.service';

@Controller('manufacturers')
export class ManufacturersController {
  constructor(private readonly manufacturersService: ManufacturersService) {}
}
