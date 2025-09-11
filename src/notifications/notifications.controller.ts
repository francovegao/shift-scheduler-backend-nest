import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NotificationEntity } from './entities/notification.entity';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('notifications')
@ApiTags('Notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: NotificationEntity })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationEntity, isArray: true })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('/my')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationEntity })
  findAllUserNotifications(
    @CurrentUser() currentUser,
    @Query() paginationDto: PaginationDto, 
  ) {
    return this.notificationsService.findAllUserNotifications(currentUser, paginationDto);
  }

  @Get('/unseen')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationEntity })
  findUnseenNotifications(
    @CurrentUser() currentUser,
    @Query() paginationDto: PaginationDto, 
  ) {
    return this.notificationsService.findUnseenNotifications(currentUser, paginationDto);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationEntity })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: NotificationEntity })
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: NotificationEntity })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
