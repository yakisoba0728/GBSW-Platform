'use client'

import { formatAwardedAt, formatSignedScore } from '../mileage/shared'
import SharedStudentReportTable from './SharedStudentReportTable'
import SharedStudentSelectionModal from './SharedStudentSelectionModal'
import SharedMileageReportView from './SharedMileageReportView'
import type {
  DormClassMileageAnalyticsResponse,
  DormClassMileageSummary,
  DormMileageHistoryItem,
  DormMileageStudentOption,
  DormStudentMileageSummary,
  DormStudentMileageAnalyticsResponse,
  PaginatedDormMileageHistoryResponse,
} from './dorm-mileage-types'

export default function DormMileageReport() {
  return (
    <SharedMileageReportView<
      DormStudentMileageSummary,
      DormMileageStudentOption,
      DormStudentMileageAnalyticsResponse,
      DormClassMileageSummary,
      DormClassMileageAnalyticsResponse,
      DormMileageHistoryItem,
      PaginatedDormMileageHistoryResponse
    >
      studentAnalyticsPath="/api/teacher/dorm-mileage/analytics/students"
      classAnalyticsPath="/api/teacher/dorm-mileage/analytics/classes"
      entriesPath="/api/teacher/dorm-mileage/entries"
      entriesExportPath="/api/teacher/dorm-mileage/entries/export"
      emptyStudentReport={{
        students: [],
        totalCount: 0,
      } satisfies DormStudentMileageAnalyticsResponse}
      emptyClassReport={{
        classes: [],
        overall: {
          classCount: 0,
          totalStudents: 0,
          rewardTotal: 0,
          penaltyTotal: 0,
          netScore: 0,
        },
      } satisfies DormClassMileageAnalyticsResponse}
      emptyAllEntriesReport={{
        items: [],
        page: 1,
        pageSize: 100,
        totalCount: 0,
      } satisfies PaginatedDormMileageHistoryResponse}
      filenamePrefix="기숙사상벌점"
      buildReportTitle={({
        reportType,
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
        const parts: string[] = ['기숙사']
        if (filterGrade) {
          parts.push(`${filterGrade}학년`)
        }
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
        { header: '학생', accessor: (entry) => entry.studentName ?? '' },
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
        <SharedStudentReportTable<DormStudentMileageSummary, DormMileageHistoryItem>
          students={students}
          startDate={startDate}
          endDate={endDate}
          entriesApiPath="/api/teacher/dorm-mileage/entries"
          entriesExportApiPath="/api/teacher/dorm-mileage/entries/export"
          emptyDescription="이 학생에게 아직 기숙사 상벌점 내역이 없습니다."
        />
      )}
      renderStudentSelectionModal={({
        isOpen,
        addedStudentIds,
        onClose,
        onConfirm,
      }) => (
        <SharedStudentSelectionModal<DormMileageStudentOption>
          isOpen={isOpen}
          addedStudentIds={addedStudentIds}
          onClose={onClose}
          onConfirm={(students: DormMileageStudentOption[]) => onConfirm(students)}
          apiPath="/api/teacher/dorm-mileage/students"
          title="대상 학생 추가"
          description="학년·반 조건으로 기숙사 학생을 찾아 추가하세요."
          emptyDescription="학년·반 조건을 바꿔 다시 찾아보세요."
          loadErrorMessage="학생 목록을 불러오지 못했습니다."
          fetchErrorMessage="학생 목록을 불러오는 중 문제가 발생했습니다."
        />
      )}
    />
  )
}
