'use client'

import {
  SCHOOL_OPTIONS,
  formatAwardedAt,
  formatSignedScore,
  getSchoolLabel,
} from '../mileage/shared'
import SharedMileageReportView from './SharedMileageReportView'
import StudentReportTable from './StudentReportTable'
import StudentSelectionModal from './StudentSelectionModal'
import type {
  ClassMileageAnalyticsResponse,
  ClassMileageSummary,
  PaginatedSchoolMileageHistoryResponse,
  SchoolCode,
  SchoolMileageHistoryItem,
  SchoolMileageStudentOption,
  StudentMileageSummary,
  StudentMileageAnalyticsResponse,
} from './school-mileage-types'

export default function SchoolMileageReport() {
  return (
    <SharedMileageReportView<
      StudentMileageSummary,
      SchoolMileageStudentOption,
      StudentMileageAnalyticsResponse,
      ClassMileageSummary,
      ClassMileageAnalyticsResponse,
      SchoolMileageHistoryItem,
      PaginatedSchoolMileageHistoryResponse
    >
      studentAnalyticsPath="/api/teacher/school-mileage/analytics/students"
      classAnalyticsPath="/api/teacher/school-mileage/analytics/classes"
      entriesPath="/api/teacher/school-mileage/entries"
      emptyStudentReport={{
        students: [],
        totalCount: 0,
      } satisfies StudentMileageAnalyticsResponse}
      emptyClassReport={{
        classes: [],
        overall: {
          classCount: 0,
          totalStudents: 0,
          rewardTotal: 0,
          penaltyTotal: 0,
          netScore: 0,
        },
      } satisfies ClassMileageAnalyticsResponse}
      emptyAllEntriesReport={{
        items: [],
        page: 1,
        pageSize: 100,
        totalCount: 0,
      } satisfies PaginatedSchoolMileageHistoryResponse}
      filenamePrefix="상벌점"
      showSchoolFilter
      schoolOptions={SCHOOL_OPTIONS}
      buildReportTitle={({
        reportType,
        filterSchool,
        filterGrade,
        startDate,
        endDate,
      }: {
        reportType: 'student' | 'class' | 'all'
        filterSchool: string
        filterGrade: string
        startDate: string
        endDate: string
      }) => {
        const parts: string[] = []
        if (filterSchool) parts.push(getSchoolLabel(filterSchool as SchoolCode))
        if (filterGrade) parts.push(`${filterGrade}학년`)
        if (startDate || endDate) {
          parts.push(`${startDate || '시작'} ~ ${endDate || '현재'}`)
        }
        return [
          reportType === 'student'
            ? '학생별 보고서'
            : reportType === 'class'
              ? '학급별 보고서'
              : '전체 내역',
          ...parts,
        ].join(' · ')
      }}
      exportStudentColumns={[
        {
          header: '학교',
          accessor: (student) =>
            student.school ? getSchoolLabel(student.school as SchoolCode) : '',
        },
        { header: '학년', accessor: (student) => student.grade ?? '' },
        { header: '반', accessor: (student) => student.classNumber ?? '' },
        { header: '번호', accessor: (student) => student.studentNumber ?? '' },
        { header: '이름', accessor: (student) => student.name },
        { header: '상점 합계', accessor: (student) => student.rewardTotal },
        { header: '벌점 합계', accessor: (student) => student.penaltyTotal },
        { header: '순점수', accessor: (student) => student.netScore },
        { header: '건수', accessor: (student) => student.entryCount },
      ]}
      exportClassColumns={[
        { header: '학급', accessor: (item) => `${item.classNumber}반` },
        { header: '상점 합계', accessor: (item) => item.rewardTotal },
        { header: '벌점 합계', accessor: (item) => item.penaltyTotal },
        { header: '순점수', accessor: (item) => item.netScore },
      ]}
      exportAllEntryColumns={[
        { header: '부여 일시', accessor: (entry) => formatAwardedAt(entry.awardedAt) },
        { header: '학생', accessor: (entry) => entry.studentName },
        {
          header: '학년/반/번호',
          accessor: (entry) =>
            `${entry.grade ?? ''}학년 ${entry.classNumber}반 ${entry.studentNumber}번`,
        },
        { header: '유형', accessor: (entry) => (entry.type === 'reward' ? '상점' : '벌점') },
        { header: '점수', accessor: (entry) => formatSignedScore(entry.type, entry.score) },
        { header: '규정 항목', accessor: (entry) => entry.ruleName },
        { header: '카테고리', accessor: (entry) => entry.ruleCategory },
        { header: '사유', accessor: (entry) => entry.reason ?? '' },
        { header: '부여 교사', accessor: (entry) => entry.teacherName },
      ]}
      renderStudentReportTable={({ students, startDate, endDate }) => (
        <StudentReportTable
          students={students}
          startDate={startDate}
          endDate={endDate}
        />
      )}
      renderStudentSelectionModal={({
        isOpen,
        addedStudentIds,
        onClose,
        onConfirm,
      }) => (
        <StudentSelectionModal
          isOpen={isOpen}
          addedStudentIds={addedStudentIds}
          onClose={onClose}
          onConfirm={(students: SchoolMileageStudentOption[]) => onConfirm(students)}
        />
      )}
    />
  )
}
