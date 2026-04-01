import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TeacherStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password';

type AuthenticatedUser = {
  accountId: string;
  name: string;
  role: 'student' | 'teacher';
  mustChangePassword: boolean;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(body: Record<string, unknown>) {
    const id = parseRequiredText(body.id, '아이디');
    const password = parseRequiredPassword(body.password, '비밀번호');
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

  async changePassword(body: Record<string, unknown>) {
    const accountId = parseRequiredText(body.accountId, '계정 아이디');
    const role = parseAccountRole(body.role);
    const allowMissingCurrentPassword =
      body.allowMissingCurrentPassword === true;
    const currentPassword = allowMissingCurrentPassword
      ? parsePassword(body.currentPassword)
      : parseRequiredPassword(body.currentPassword, '현재 비밀번호');
    const newPassword = parseRequiredPassword(body.newPassword, '새 비밀번호');

    validateNewPassword(newPassword);

    if (role === 'student') {
      return this.changeStudentPassword(
        accountId,
        currentPassword,
        newPassword,
        allowMissingCurrentPassword,
      );
    }

    return this.changeTeacherPassword(
      accountId,
      currentPassword,
      newPassword,
      allowMissingCurrentPassword,
    );
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
        mustChangePassword: true,
      },
    });

    if (student && verifyPassword(password, student.passwordHash)) {
      return {
        accountId: student.studentId,
        name: student.name,
        role: 'student',
        mustChangePassword: student.mustChangePassword,
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
        mustChangePassword: true,
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
        mustChangePassword: teacher.mustChangePassword,
      } satisfies AuthenticatedUser;
    }

    return null;
  }

  private async changeStudentPassword(
    accountId: string,
    currentPassword: string,
    newPassword: string,
    allowMissingCurrentPassword: boolean,
  ) {
    const student = await this.prisma.student.findUnique({
      where: {
        studentId: accountId,
      },
      select: {
        studentId: true,
        passwordHash: true,
        mustChangePassword: true,
      },
    });

    const canSkipCurrentPassword =
      allowMissingCurrentPassword && student?.mustChangePassword === true;

    if (
      !student ||
      (!canSkipCurrentPassword &&
        !verifyPassword(currentPassword, student.passwordHash))
    ) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    await this.prisma.student.update({
      where: {
        studentId: student.studentId,
      },
      data: {
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    return {
      ok: true,
      user: {
        accountId: student.studentId,
        role: 'student',
        mustChangePassword: false,
      },
    };
  }

  private async changeTeacherPassword(
    accountId: string,
    currentPassword: string,
    newPassword: string,
    allowMissingCurrentPassword: boolean,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        teacherId: accountId,
      },
      select: {
        teacherId: true,
        passwordHash: true,
        status: true,
        mustChangePassword: true,
      },
    });

    const canSkipCurrentPassword =
      allowMissingCurrentPassword && teacher?.mustChangePassword === true;

    if (
      !teacher ||
      teacher.status !== TeacherStatus.ACTIVE ||
      (!canSkipCurrentPassword &&
        !verifyPassword(currentPassword, teacher.passwordHash))
    ) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    await this.prisma.teacher.update({
      where: {
        teacherId: teacher.teacherId,
      },
      data: {
        passwordHash: hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    return {
      ok: true,
      user: {
        accountId: teacher.teacherId,
        role: 'teacher',
        mustChangePassword: false,
      },
    };
  }
}

function parseRequiredText(value: unknown, label: string) {
  const text = toInputText(value);

  if (!text) {
    throw new BadRequestException(`${label}를 입력해주세요.`);
  }

  return text;
}

function parseRequiredPassword(value: unknown, label: string) {
  const password = parsePassword(value);

  if (password.length === 0) {
    throw new BadRequestException(`${label}를 입력해주세요.`);
  }

  return password;
}

function parsePassword(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  return '';
}

function parseAccountRole(value: unknown) {
  if (value === 'student' || value === 'teacher') {
    return value;
  }

  throw new BadRequestException('계정 권한 정보가 올바르지 않습니다.');
}

function validateNewPassword(password: string) {
  if (password.trim().length === 0) {
    throw new BadRequestException(
      '새 비밀번호는 공백만으로 설정할 수 없습니다.',
    );
  }

  if (password.length < 10) {
    throw new BadRequestException('새 비밀번호는 10자 이상이어야 합니다.');
  }
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
