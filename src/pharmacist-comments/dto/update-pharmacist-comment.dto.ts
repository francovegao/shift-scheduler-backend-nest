import { PartialType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { CreatePharmacistCommentDto } from './create-pharmacist-comment.dto';

export class UpdatePharmacistCommentDto extends PartialType(
  CreatePharmacistCommentDto,
) {
  @ApiProperty()
  id: string;
}
