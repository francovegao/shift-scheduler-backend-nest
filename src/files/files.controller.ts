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
import { FilesService } from './files.service';
import {
  ApiCreatedResponse,
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { FileEntity } from './entities/file.entity';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('files')
@ApiTags('Files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: FileEntity })
  create(@Body() createFileDto: CreateFileDto) {
    return this.filesService.create(createFileDto);
  }

  @Get()
  findAll() {
    return this.filesService.findAll();
  }

  @Get('/my')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'type', required: true, type: String })
  @ApiOkResponse({ type: FileEntity })
  findCurrentUserFileByType(
    @CurrentUser() currentUser,
    @Query('type') type?: string,
  ) {
    return this.filesService.findCurrentUserFileByType(currentUser, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: FileEntity })
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(id, updateFileDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: FileEntity })
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
