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
import { CancellationRequestsService } from './cancellation-requests.service';
import { CreateCancellationRequestDto } from './dto/create-cancellation-request.dto';
import { UpdateCancellationRequestDto } from './dto/update-cancellation-request.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { CancellationRequestsEntity } from './entities/cancellation-request.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { ProcessCancellationRequestDto } from './dto/process-cancellation-request.dto';

@Controller('cancellation-requests')
@ApiTags('cancellation-requests')
export class CancellationRequestsController {
  constructor(
    private readonly cancellationRequestsService: CancellationRequestsService,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CancellationRequestsEntity })
  create(@Body() createCancellationRequestDto: CreateCancellationRequestDto) {
    return this.cancellationRequestsService.create(
      createCancellationRequestDto,
    );
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CancellationRequestsEntity, isArray: true })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.cancellationRequestsService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CancellationRequestsEntity })
  findOne(@Param('id') id: string) {
    return this.cancellationRequestsService.findOne(id);
  }

  @Patch(':id/process')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CancellationRequestsEntity })
  processRequest(
    @Param('id') id: string,
    @Body() processCancellationRequestDto: ProcessCancellationRequestDto,
  ) {
    return this.cancellationRequestsService.process(
      id,
      processCancellationRequestDto,
    );
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CancellationRequestsEntity })
  remove(@Param('id') id: string) {
    return this.cancellationRequestsService.remove(id);
  }
}
