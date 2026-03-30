import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TeacherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from './password';

type AuthenticatedUser = {
  accountId: string;
  name: string;
  role: 'student' | 'teacher';
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(body: Record<string, unknown>) {
    const id = parseRequiredText(body.id, '아이디');
    const password = parseRequiredText(body.password, '비밀번호');
    const user = await this.findAuthenticatedUser(id, password);

    if (!user) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    return {
      ok: true,
      user,
    };
  }

  private async findAuthenticatedUser(id: string, password: string) {
    const student = await this.prisma.student.findUnique({
      where: {
        studentId: id,
      },
      select: {
        studentId: true,
        name: true,
        passwordHash: true,
      },
    });

    if (student && verifyPassword(password, student.passwordHash)) {
      return {
        accountId: student.studentId,
        name: student.name,
        role: 'student',
      } satisfies AuthenticatedUser;
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: {
        teacherId: id,
      },
      select: {
        teacherId: true,
        name: true,
        passwordHash: true,
        status: true,
      },
    });

    if (
      teacher &&
      teacher.status === TeacherStatus.ACTIVE &&
      verifyPassword(password, teacher.passwordHash)
    ) {
      return {
        accountId: teacher.teacherId,
        name: teacher.name,
        role: 'teacher',
      } satisfies AuthenticatedUser;
    }

    return null;
  }
}

function parseRequiredText(value: unknown, label: string) {
  const text = toInputText(value);

  if (!text) {
    throw new BadRequestException(`${label}를 입력해주세요.`);
  }

  return text;
}

function toInputText(value: unknown) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  return '';
}
