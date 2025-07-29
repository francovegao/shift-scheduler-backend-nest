import { INestApplication, Injectable } from '@nestjs/common';
//import { PrismaClient } from '@prisma/client';
import { PrismaClient } from 'generated/prisma';
//import { Prisma, PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient {}


