import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthorStudioEnabledGuard implements CanActivate {
  canActivate() {
    if (process.env.AUTHOR_STUDIO_ENABLED !== 'true') {
      throw new NotFoundException('Author Studio is disabled');
    }
    return true;
  }
}
