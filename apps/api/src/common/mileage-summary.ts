type StudentIdentity = {
  grade: number | null;
  classNumber: number;
  studentNumber: number;
  name: string;
};

type MileageSummary = StudentIdentity & {
  rewardTotal: number;
  penaltyTotal: number;
  netScore: number;
  entryCount: number;
};

type MileageEntry = {
  type: string;
  score: number;
};

export function calculateStudentGrade(studentId: string, currentYear: number) {
  const match = /^[A-Za-z]{2}(\d{2})/.exec(studentId);

  if (!match) {
    return null;
  }

  const admissionYearSuffix = Number.parseInt(match[1], 10);

  if (Number.isNaN(admissionYearSuffix)) {
    return null;
  }

  const currentCentury = Math.floor(currentYear / 100) * 100;
  let admissionYear = currentCentury + admissionYearSuffix;

  if (admissionYear > currentYear) {
    admissionYear -= 100;
  }

  const grade = currentYear - admissionYear + 1;

  if (grade < 1 || grade > 3) {
    return null;
  }

  return grade;
}

export function compareStudentIdentity<T extends StudentIdentity>(
  left: T,
  right: T,
) {
  return (
    compareNullableNumber(left.grade, right.grade) ||
    left.classNumber - right.classNumber ||
    left.studentNumber - right.studentNumber ||
    left.name.localeCompare(right.name, 'ko')
  );
}

export function compareStudentMileageSummary<T extends MileageSummary>(
  left: T,
  right: T,
) {
  return compareStudentIdentity(left, right);
}

export function buildStudentMileageSummary<
  TStudent extends object,
  TEntry extends MileageEntry,
>(student: TStudent, entries: TEntry[]) {
  let rewardTotal = 0;
  let penaltyTotal = 0;

  for (const entry of entries) {
    if (entry.type === 'REWARD') {
      rewardTotal += entry.score;
    } else {
      penaltyTotal += entry.score;
    }
  }

  return {
    ...student,
    rewardTotal,
    penaltyTotal,
    netScore: rewardTotal - penaltyTotal,
    entryCount: entries.length,
  };
}

export function buildClassMileageSummary<TSummary extends MileageSummary>(
  classNumber: number,
  studentSummaries: TSummary[],
) {
  const rewardTotal = studentSummaries.reduce(
    (acc, student) => acc + student.rewardTotal,
    0,
  );
  const penaltyTotal = studentSummaries.reduce(
    (acc, student) => acc + student.penaltyTotal,
    0,
  );
  const netScore = rewardTotal - penaltyTotal;
  const avgNetScore =
    studentSummaries.length > 0
      ? Math.round((netScore / studentSummaries.length) * 10) / 10
      : 0;
  const rankedStudents = studentSummaries.filter(
    (student) => student.entryCount > 0,
  );
  const sortedByNetScore = [...rankedStudents].sort(
    (left, right) =>
      right.netScore - left.netScore ||
      compareStudentMileageSummary(left, right),
  );

  return {
    classNumber,
    studentCount: studentSummaries.length,
    rewardTotal,
    penaltyTotal,
    netScore,
    avgNetScore,
    topStudents: sortedByNetScore.slice(0, 3),
    bottomStudents:
      sortedByNetScore.length > 3 ? sortedByNetScore.slice(-3).reverse() : [],
  };
}

function compareNullableNumber(left: number | null, right: number | null) {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left - right;
}
