import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();


prisma.$use(async (params, next) => {
    if (params.model === 'User' && (params.action === 'create' || params.action === 'update')) {
      const user = params.args.data;
      if (user.password) {
        const saltRounds = 10;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  
    return next(params);
  });

export default prisma;