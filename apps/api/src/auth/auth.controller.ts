import { Body, Controller, Headers, Post } from '@nestjs/common';
import { assertInternalApiRequest } from '../common/internal-api-auth';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: Record<string, unknown>) {
    return this.authService.login(body);
  }

  @Post('change-password')
  changePassword(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Headers('x-actor-session-id') actorSessionId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.authService.changePassword(actorSessionId, body);
  }

  @Post('sessions/resolve')
  resolveSession(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.authService.resolveSession(body);
  }

  @Post('sessions/revoke')
  revokeSession(
    @Headers('x-internal-api-secret') internalApiSecret: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    assertInternalApiRequest(internalApiSecret);

    return this.authService.revokeSession(body);
  }
}
