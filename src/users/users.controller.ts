import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { CreateFirebaseUserDto } from './dto/create-firebase-user.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: UserEntity })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/firebase')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({   })
  createFirebaseUser(@Body() createFirebaseUserDto: CreateFirebaseUserDto) {
    return this.usersService.createFirebaseUser(createFirebaseUserDto);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'companyId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiOkResponse({ type: UserEntity, isArray: true })
  findAll(
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
    @Query('locationId') locationId?: string,
    @Query('companyId') companyId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: "asc" | "desc",
  ) {
    return this.usersService.findAll(paginationDto, search, locationId, companyId, sortBy, sortOrder);
  }

  @Get('/pharmacists')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  @ApiOkResponse({ type: UserEntity, isArray: true })
  findPharmacists(
    @Query() paginationDto: PaginationDto, 
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: "asc" | "desc",
  ) {
    return this.usersService.findPharmacists(paginationDto, search, sortBy, sortOrder);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User ${id} does not exist.`);
    }
    return user;
  }

  @Get('/pharmacist/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async findOnePharmacist(@Param('id') id: string) {
    const user = await this.usersService.findOnePharmacist(id);
    if (!user) {
      throw new NotFoundException(`User ${id} does not exist.`);
    }
    return user;
  }

  @Get('/fb/:uid')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async findOneUid(@Param('uid') uid: string) {
    const user = await this.usersService.findOneUid(uid);
    if (!user) {
      throw new NotFoundException(`User ${uid} does not exist.`);
    }
    return user;
  }

  @Get('/me/:uid')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async findMyRole(@Param('uid') uid: string) {
    const user = await this.usersService.findMyRole(uid);
    if (!user) {
      throw new NotFoundException(`User ${uid} does not exist.`);
    }
    return user;
  }

  @Get('/shifts/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  findShifts(@Param('id') id: string) {
    return this.usersService.findShifts(id);
  }

  @Get('/notifications/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  findNotifications(@Param('id') id: string) {
    return this.usersService.findNotifications(id);
  }

  @Get(':id/files')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  findFiles(@Param('id') id: string) {
    return this.usersService.findFiles(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
