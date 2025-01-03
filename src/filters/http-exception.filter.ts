import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 如果是 API 请求，返回 JSON 格式的错误信息
    if (request.url.startsWith('/api') || request.headers.accept?.includes('application/json')) {
      response.status(status).json({
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: typeof exceptionResponse === 'object' 
          ? (exceptionResponse as any).message || exception.message
          : exceptionResponse
      });
    } 
    // 如果是页面请求，重定向到错误页面
    else {
      const message = typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message || exception.message
        : exceptionResponse;
      
      response.redirect(`/error?status=${status}&message=${encodeURIComponent(message)}`);
    }
  }
} 