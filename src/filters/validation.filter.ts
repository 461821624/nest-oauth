import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';

@Catch(ValidationError)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationError[], host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 格式化验证错误信息
    const errors = this.formatErrors(exception);

    // 如果是 API 请求，返回 JSON 格式的错误信息
    if (request.url.startsWith('/api') || request.headers.accept?.includes('application/json')) {
      response.status(400).json({
        success: false,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: '请求参数验证失败',
        errors
      });
    } 
    // 如果是页面请求，重定向到错误页面
    else {
      const message = Object.values(errors).join(', ');
      response.redirect(`/error?status=400&message=${encodeURIComponent(message)}`);
    }
  }

  private formatErrors(errors: ValidationError[]) {
    const formattedErrors = {};
    errors.forEach(error => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints)[0];
      }
      if (error.children?.length) {
        formattedErrors[error.property] = this.formatErrors(error.children);
      }
    });
    return formattedErrors;
  }
} 