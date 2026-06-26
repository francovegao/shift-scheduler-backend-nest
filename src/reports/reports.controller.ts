import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

@Controller('reports')
@ApiTags('Reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('csv')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  generateCsv(@Body() generateReportDto: GenerateReportDto) {
    return this.reportsService.generateCsvReport(generateReportDto);
  }
}
