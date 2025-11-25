import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyEntity } from './entities/company.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

@Controller('companies')
@ApiTags('Companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CompanyEntity })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiOkResponse({ type: CompanyEntity, isArray: true })
  findAll(
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: "asc" | "desc",
   ) {
    return this.companiesService.findAll(paginationDto, search, sortBy, sortOrder);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyEntity })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Get('/shifts/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyEntity })
  findShifts(@Param('id') id: string) {
    return this.companiesService.findShifts(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: CompanyEntity })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: CompanyEntity })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
