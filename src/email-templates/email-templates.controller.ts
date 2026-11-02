import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { EmailTemplateDraftDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { EmailTemplateEntity } from './entities/email-template.entity';
import {
  AuthenticatedUser,
  EmailTemplatesService,
} from './email-templates.service';
import { PaginationDto } from 'src/common/pagination/dto/pagination-query.dto';

@Controller('/email-templates')
@ApiTags('email-templates')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ type: EmailTemplateEntity, isArray: true })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.emailTemplatesService.findAll(
      currentUser,
      paginationDto,
      search,
    );
  }

  @Get(':key')
  @ApiOkResponse({ type: EmailTemplateEntity })
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('key') key: string,
  ) {
    return this.emailTemplatesService.findOne(currentUser, key);
  }

  @Put(':key')
  @ApiOkResponse({ type: EmailTemplateEntity })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('key') key: string,
    @Body() updateEmailTemplateDto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplatesService.update(
      currentUser,
      key,
      updateEmailTemplateDto,
    );
  }

  @Post(':key/validate')
  validate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('key') key: string,
    @Body() draft: EmailTemplateDraftDto,
  ) {
    return this.emailTemplatesService.validate(currentUser, key, draft);
  }

  @Post(':key/preview')
  preview(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('key') key: string,
    @Body() draft: EmailTemplateDraftDto,
  ) {
    return this.emailTemplatesService.preview(currentUser, key, draft);
  }

  @Post(':key/test')
  sendTestEmail(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('key') key: string,
    @Body() dto: SendTestEmailDto,
  ) {
    return this.emailTemplatesService.sendTestEmail(currentUser, key, dto);
  }
}
