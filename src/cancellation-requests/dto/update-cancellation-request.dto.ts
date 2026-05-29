import { PartialType } from '@nestjs/swagger';
import { CreateCancellationRequestDto } from './create-cancellation-request.dto';

export class UpdateCancellationRequestDto extends PartialType(CreateCancellationRequestDto) {}
