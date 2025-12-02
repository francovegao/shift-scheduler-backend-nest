import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ShiftsService } from '../shifts/shifts.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log']
  });

  const shiftsService = app.get(ShiftsService);

  console.log('Running auto-complete job...');
  await shiftsService.autoCompleteShifts();  // <-- you implement this
  console.log('Job complete.');

  await app.close();
}

bootstrap();
