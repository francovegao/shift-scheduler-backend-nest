/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { PharmacistRequestsService } from './pharmacist-requests.service';
import { CreatePharmacistRequestDto } from './dto/create-pharmacist-request.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { PharmacistRequestsEntity } from './entities/pharmacist-request.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { RejectPharmacistRequestDto } from './dto/reject-pharmacist-request.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { ApprovePharmacistRequestDto } from './dto/approve-pharmacist-request.dto';

@Controller('pharmacist-requests')
@ApiTags('pharmacist-requests')
export class PharmacistRequestsController {
  constructor(
    private readonly pharmacistRequestsService: PharmacistRequestsService,
  ) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: PharmacistRequestsEntity })
  create(
    @CurrentUser() currentUser,
    @Body() createPharmacistRequestDto: CreatePharmacistRequestDto,
  ) {
    return this.pharmacistRequestsService.create(
      currentUser,
      createPharmacistRequestDto,
    );
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistRequestsEntity, isArray: true })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.pharmacistRequestsService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistRequestsEntity })
  findOne(@Param('id') id: string) {
    return this.pharmacistRequestsService.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistRequestsEntity })
  approveRequest(
    @CurrentUser() currentUser,
    @Param('id') id: string,
    @Body() approvePharmacistRequestDto: ApprovePharmacistRequestDto,
  ) {
    return this.pharmacistRequestsService.approve(
      currentUser,
      id,
      approvePharmacistRequestDto,
    );
  }

  @Patch(':id/reject')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistRequestsEntity })
  rejectRequest(
    @CurrentUser() currentUser,
    @Param('id') id: string,
    @Body() rejectPharmacistRequestDto: RejectPharmacistRequestDto,
  ) {
    return this.pharmacistRequestsService.reject(
      currentUser,
      id,
      rejectPharmacistRequestDto,
    );
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: PharmacistRequestsEntity })
  remove(@CurrentUser() currentUser, @Param('id') id: string) {
    return this.pharmacistRequestsService.remove(currentUser, id);
  }
}
