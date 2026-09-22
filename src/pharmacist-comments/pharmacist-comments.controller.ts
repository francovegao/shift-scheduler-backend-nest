import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PharmacistCommentsService } from './pharmacist-comments.service';
import { CreatePharmacistCommentDto } from './dto/create-pharmacist-comment.dto';
import { UpdatePharmacistCommentDto } from './dto/update-pharmacist-comment.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { PharmacistCommentEntity } from './entities/pharmacist-comment.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('pharmacist-comments')
@ApiTags('pharmacist-comments')
export class PharmacistCommentsController {
  constructor(
    private readonly pharmacistCommentsService: PharmacistCommentsService,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PharmacistCommentEntity })
  create(
    @CurrentUser() currentUser: any,
    @Body() createPharmacistCommentDto: CreatePharmacistCommentDto,
  ) {
    return this.pharmacistCommentsService.create(
      currentUser,
      createPharmacistCommentDto,
    );
  }

  @Get('pharmacist/:pharmacistId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistCommentEntity, isArray: true })
  findByPharmacist(
    @Param('pharmacistId') pharmacistId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.pharmacistCommentsService.findByPharmacist(
      pharmacistId,
      paginationDto,
    );
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistCommentEntity })
  update(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
    @Body() updatePharmacistCommentDto: UpdatePharmacistCommentDto,
  ) {
    return this.pharmacistCommentsService.update(
      currentUser,
      id,
      updatePharmacistCommentDto,
    );
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistCommentEntity })
  remove(@CurrentUser() currentUser: any, @Param('id') id: string) {
    return this.pharmacistCommentsService.remove(currentUser, id);
  }
}
