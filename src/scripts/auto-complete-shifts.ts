import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ShiftsService } from '../shifts/shifts.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log']
  });

  const shiftsService = app.get(ShiftsService);

  console.log('Running auto-complete job...');
  const results = await shiftsService.autoCompleteShifts();
  console.log('Job complete. Result:', results);

  await app.close();
}

bootstrap();
