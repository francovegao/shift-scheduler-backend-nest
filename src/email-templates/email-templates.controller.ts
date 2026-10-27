import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
import { EmailTemplateDraftDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { EmailTemplateEntity } from './entities/email-template.entity';
import {
  AuthenticatedUser,
  EmailTemplatesService,
} from './email-templates.service';

@Controller('/email-templates')
@ApiTags('email-templates')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  @ApiOkResponse({ type: EmailTemplateEntity, isArray: true })
  findAll(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.emailTemplatesService.findAll(currentUser);
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
}
