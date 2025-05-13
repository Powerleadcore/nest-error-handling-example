import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
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

  use(req: FastifyRequest, res: FastifyReply, next: () => void): void {
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

  private logIncomingRequest(req: FastifyRequest): void {
    // Extract useful information from the request
    const { method, url, headers, query, body, ip, hostname, protocol } = req;

    // Get the real IP address (considering proxies)
    const realIp = this.getRealIp(req);

    // Extract user agent info
    const userAgent = headers['user-agent'] || 'unknown';

    // Sanitize request body to remove sensitive information
    const sanitizedBody =
      method !== 'GET' && body && !this.isMultipartFormData(headers)
        ? JSON.stringify(body)
        : undefined;

    this.logger.log(`Incoming ${method} request to ${url}`, {
      category: LogCategory.HTTP,
      correlationId: requestStorage.getStore()?.correlationId,
      payload: {
        type: 'REQUEST',
        method,
        path: url,
        query,
        headers,
        // Enhanced context information
        requestContext: {
          ip: realIp,
          forwardedIp: headers['x-forwarded-for'],
          userAgent,
          hostname,
          protocol,
          referer: headers.referer || headers.referrer,
          timestamp: new Date().toISOString(),
        },
        // Only include body for non-GET requests and when appropriate
        ...(sanitizedBody ? { body: sanitizedBody } : {}),
      },
    });
  }

  private getRealIp(req: FastifyRequest): string {
    // Try to get the real IP address accounting for proxies
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      // x-forwarded-for can be a comma-separated list, the first entry is the original client
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : (typeof forwardedFor === 'string' && forwardedFor) ? (forwardedFor.split(',')[0] || '').trim() : '';
      return ips || 'unknown';
    }

    // Fastify specific IP retrieval
    return req.ip || 'unknown';
  }

  private captureResponseData(
    res: FastifyReply,
    req: FastifyRequest,
    startTime: number,
  ): void {
    // Store original methods
    const originalSend = res.send;

    // Fastify uses send instead of write/end
    let responseBody: any = undefined;
    let contentType = '';

    // Override send method to capture response data
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    res.send = function (this: FastifyReply, payload?: any): FastifyReply {
      // Calculate response time before executing original method
      const responseTime = Date.now() - startTime;

      // Store data for logging
      responseBody = payload;
      contentType = res.getHeader('content-type') as string || '';

      // Execute original send method
      const result = originalSend.apply(this, [payload]);

      // Get status code
      const statusCode = res.statusCode;

      // Determine if we should log the body
      const shouldLog = self.shouldCaptureResponseBody(res, contentType);

      // Prepare response for logging
      let loggedBody: any = undefined;

      if (shouldLog && responseBody !== undefined) {
        // Calculate response size
        const bodySize = typeof responseBody === 'string'
          ? Buffer.from(responseBody).length
          : Buffer.from(JSON.stringify(responseBody) || '').length;

        if (bodySize <= self.maxBodySize) {
          try {
            // Sanitize response body to remove sensitive data
            loggedBody =
              typeof responseBody === 'object'
                ? JSON.stringify(responseBody)
                : String(responseBody)
          } catch (error) {
            loggedBody = `<Error sanitizing response body: ${error.message}>`;
          }
        } else {
          loggedBody = `<Response body too large: ${bodySize} bytes>`;
        }
      }

      // Get the real IP, reusing the method
      const realIp = self.getRealIp(req);

      // Log the response
      self.logger.log(`Response ${statusCode} sent in ${responseTime}ms`, {
        category: LogCategory.HTTP,
        correlationId: requestStorage.getStore()?.correlationId,
        payload: {
          type: 'RESPONSE',
          method: req.method,
          path: req.url,
          statusCode,
          responseTime,
          contentType,
          // Enhanced context information
          responseContext: {
            ip: realIp,
            bytesSize: typeof loggedBody === 'string' ? Buffer.from(loggedBody).length : undefined,
            route: req.routeOptions?.url,
            routeParams: req.params,
          },
          ...(loggedBody !== undefined ? { body: loggedBody } : {}),
        },
      });

      return result;
    };
  }

  private shouldCaptureResponseBody(
    res: FastifyReply,
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