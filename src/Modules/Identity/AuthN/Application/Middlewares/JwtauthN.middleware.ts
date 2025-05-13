import { Inject, NestMiddleware } from "@nestjs/common";
import { JwtTokenService } from "../../Infrastructure/Services/JwtTokenService";
import { Context } from "@Modules/AuthZ/Interfaces/context";
import { InjectRepository } from "@nestjs/typeorm";
import { UserSchema } from "@Modules/Identity/Users/Infrastructure/Database";
import { Repository } from "typeorm";
import { iUser } from "@Modules/Identity/Users/Domain";
import Roles from "@Modules/AuthZ/Enums/roles.enums";

export class JwtAuthNMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: JwtTokenService,
    @InjectRepository(UserSchema)
    private readonly userRepository: Repository<iUser>,
  ) { }

  async use(req: any, res: any, next: () => void) {
    const token = req.headers['x-auth-token'];
    if (token) {
      const payload = await this.tokenService.verifyAccessToken(token);
      if (payload && payload.sub) {
        const user = await this.userRepository.findOne({
          where: { userId: payload.sub },
        });
        if (user) {
          const context: Context = {
            userId: payload.sub,
            role: user.role as Roles,
            rank: user.rank,
            isActive: user.status === 'ACTIVE',
            assignedUsers: [],
          }
          req['context'] = context;
        }
      }
    }
    next();
  }
}