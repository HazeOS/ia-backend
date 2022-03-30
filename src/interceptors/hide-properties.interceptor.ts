import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { User } from '../schemas/user.schema';

@Injectable()
export class HidePropertiesInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    const propertiesToHide = this.reflector.get<string[]>(
      'propertiesToHide',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest();
    const resource = request.url.split('/').pop();
    const user = request.user as User;
    const userPermissions = user.role.permissions
      .map((permission) => permission.name)
      .filter((permission) => permission.includes(resource));
    if (userPermissions.includes(`permissions.${resource}.readFull`)) {
      return next.handle();
    } else {
      return next.handle().pipe(
        // TODO не удаляет свойства
        map((value) => {
          propertiesToHide.forEach((property) => {
            delete value[property];
          });
        }),
      );
    }
  }
}