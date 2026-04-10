// storage.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('uploads')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('signed-url')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  getSignedUploadUrl(@Body() body: { fileName: string; contentType: string }) {
    return this.storageService.getSignedUploadUrl(
      body.fileName,
      body.contentType,
    );
  }

  @Get('signed-url/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  getSignedDownloadUrl(@Param('id') id: string) {
    return this.storageService.getSignedDownloadUrl(id);
  }
}
