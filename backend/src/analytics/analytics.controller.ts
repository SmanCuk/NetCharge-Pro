import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiQuery({ name: 'period', enum: ['7days', '30days', '12months'], required: false })
  async getRevenue(@Query('period') period: string = '30days') {
    return this.analyticsService.getRevenueStats(period);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer growth statistics' })
  @ApiQuery({ name: 'period', enum: ['7days', '30days', '12months'], required: false })
  async getCustomerGrowth(@Query('period') period: string = '30days') {
    return this.analyticsService.getCustomerGrowth(period);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment statistics' })
  async getPaymentStats() {
    return this.analyticsService.getPaymentStats();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  async getSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
