import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../Services/Logger.service';
import { LogCategory } from '../Enums/logCategory.enum';
import { requestStorage } from '../Context/requestContext.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HttpMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpMiddleware.name);
  private readonly logResponseBody: boolean;
  private readonly maxBodySize: number;
  private readonly sensitiveDataPatterns: RegExp[];
  private readonly allowedContentTypes: string[];

  constructor(private configService: ConfigService) {
    // Load config from environment variables or configuration files
    this.logResponseBody = this.configService.get<boolean>(
      'LOG_RESPONSE_BODY',
      true,
    );
    this.maxBodySize = this.configService.get<number>(
      'LOG_MAX_BODY_SIZE',
      10000,
    ); // 10KB default limit
    this.allowedContentTypes = this.configService.get<string[]>(
      'LOG_ALLOWED_CONTENT_TYPES',
      [
        'application/json',
        'text/plain',
        'application/xml',
        'text/xml',
        'application/x-www-form-urlencoded',
      ],
    );

    // Patterns for sensitive data that should be redacted
    this.sensitiveDataPatterns = [
      /password\s*:\s*["']?[^"',\s]+["']?/gi,
      /token\s*:\s*["']?[^"',\s]+["']?/gi,
      /authorization\s*:\s*["']?[^"',\s]+["']?/gi,
      /secret\s*:\s*["']?[^"',\s]+["']?/gi,
      /key\s*:\s*["']?[^"',\s]+["']?/gi,
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // Credit card pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // Email pattern
    ];
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    // IMPORTANT: Create and run with context FIRST
    // Then do everything else inside the callback
    requestStorage.run(
      {
        correlationId: crypto.randomUUID(),
      },
      () => {
        // Log the incoming request
        this.logIncomingRequest(req);
        // Set up response logging
        this.captureResponseData(res, req, startTime);
        // Continue to the next middleware
        next();
      },
    );
  }

  private logIncomingRequest(req: Request): void {
    // Extract useful information from the request
    const { method, originalUrl, headers, query, body } = req;
    this.logger.log(`Incoming ${method} request to ${originalUrl}`, {
      category: LogCategory.HTTP,
      payload: {
        type: 'REQUEST',
        method,
        path: originalUrl,
        query,
        headers: headers,
        // Only include body for non-GET requests and when appropriate
        ...(method !== 'GET' && body && !this.isMultipartFormData(headers)
          ? { body: body }
          : {}),
      },
    });
  }

  private captureResponseData(
    res: Response,
    req: Request,
    startTime: number,
  ): void {
    // Store the original methods
    const originalEnd = res.end;
    const originalWrite = res.write;
    const originalSetHeader = res.setHeader;
    const chunks: Buffer[] = [];

    // Track if we should capture the response body
    let contentType = '';

    // Override setHeader to capture content-type when it's set
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    res.setHeader = function (
      name: string,
      value: string | number | readonly string[],
    ): Response {
      if (name.toLowerCase() === 'content-type') {
        contentType = Array.isArray(value) ? value[0] : String(value);
      }
      // eslint-disable-next-line prefer-rest-params
      return originalSetHeader.apply(this, arguments);
    };

    // Override write method to capture response data chunks
    res.write = function (this: Response, chunk: any, ...args: any[]): boolean {
      // Always capture chunks, we'll filter later
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      }
      return originalWrite.apply(this, [chunk, ...args]);
    };

    // Override end method to capture response data
    const logger = this.logger;
    res.end = function (this: Response, chunk?: any, ...args: any[]): Response {
      // If there's a chunk in the end call, capture it too
      if (chunk) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk));
        }
      }

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Get status code
      const statusCode = res.statusCode;

      // If content-type wasn't set via setHeader, try to get it now
      if (!contentType) {
        contentType = String(res.getHeader('content-type') || '');
      }

      // Calculate total response size
      const responseSize = chunks.reduce(
        (total, chunk) => total + chunk.length,
        0,
      );

      // Prepare response body when appropriate
      let responseBody = undefined;
      const shouldLog = self.shouldCaptureResponseBody(res, contentType);

      if (shouldLog && responseSize > 0) {
        if (responseSize <= self.maxBodySize) {
          try {
            // Combine chunks and convert to string
            const bodyBuffer = Buffer.concat(chunks);
            const bodyString = bodyBuffer.toString('utf8');

            // Try to parse JSON if applicable
            if (contentType.includes('application/json')) {
              try {
                responseBody = JSON.parse(bodyString);
              } catch {
                // If JSON parsing fails, log as plain text
                responseBody = bodyString;
              }
            } else {
              responseBody = bodyString;
            }
          } catch (error) {
            responseBody = `<Error parsing response body: ${error.message}>`;
          }
        } else {
          responseBody = `<Response body too large: ${responseSize} bytes>`;
        }
      }

      // Log the response with debugging info
      logger.log(`Response ${statusCode} sent in ${responseTime}ms`, {
        category: LogCategory.HTTP,
        payload: {
          type: 'RESPONSE',
          method: req.method,
          path: req.originalUrl,
          statusCode,
          responseTime,
          responseSize,
          contentType,
          ...(responseBody !== undefined ? { body: responseBody } : {}),
        },
      });

      // Call the original end method
      return originalEnd.apply(this, chunk ? [chunk, ...args] : args);
    };
  }

  private shouldCaptureResponseBody(
    res: Response,
    contentType: string = '',
  ): boolean {
    if (!this.logResponseBody) return false;

    // Use provided content type or try to get from headers
    const type = contentType || (res.getHeader('content-type') as string) || '';

    return this.allowedContentTypes.some((allowedType) => {
      return type.toLowerCase().includes(allowedType.toLowerCase());
    });
  }

  private isMultipartFormData(headers: Record<string, any>): boolean {
    const contentType = headers['content-type'] || '';
    return contentType.includes('multipart/form-data');
  }
}
