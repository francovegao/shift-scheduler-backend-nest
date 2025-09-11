import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreatedResponse({ type: UserEntity })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiOkResponse({ type: UserEntity, isArray: true })
  findAll(
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.usersService.findAll(paginationDto, search, locationId, companyId);
  }

  @Get('/pharmacists')
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: UserEntity, isArray: true })
  findPharmacists(
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
  ) {
    return this.usersService.findPharmacists(paginationDto, search);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserEntity })
  //findOne(@Param('id') id: string) {
    //return this.usersService.findOne(id);
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User ${id} does not exist.`);
    }
    return user;
  }

  @Get('/fb/:uid')
  @ApiOkResponse({ type: UserEntity })
  async findOneUid(@Param('uid') uid: string) {
    const user = await this.usersService.findOneUid(uid);
    if (!user) {
      throw new NotFoundException(`User ${uid} does not exist.`);
    }
    return user;
  }

  @Get('/me/:uid')
  @ApiOkResponse({ type: UserEntity })
  async findMyRole(@Param('uid') uid: string) {
    const user = await this.usersService.findMyRole(uid);
    if (!user) {
      throw new NotFoundException(`User ${uid} does not exist.`);
    }
    return user;
  }

  @Get('/notifications/:id')
  @ApiOkResponse({ type: UserEntity })
  findNotifications(@Param('id') id: string) {
    return this.usersService.findNotifications(id);
  }

  @Get(':id/files')
  @ApiOkResponse({ type: UserEntity })
  findFiles(@Param('id') id: string) {
    return this.usersService.findFiles(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserEntity })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: UserEntity })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
