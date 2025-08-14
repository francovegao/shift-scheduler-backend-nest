import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CompanyEntity } from './entities/company.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('companies')
@ApiTags('Companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiCreatedResponse({ type: CompanyEntity })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: CompanyEntity, isArray: true })
  findAll(
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
   ) {
    return this.companiesService.findAll(paginationDto, search);
  }

  @Get(':id')
  @ApiOkResponse({ type: CompanyEntity })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiCreatedResponse({ type: CompanyEntity })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: CompanyEntity })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
