import {
  DataTable,
  DataTableSkeleton,
  OverflowMenu,
  OverflowMenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { formatDatetime, launchWorkspace, parseDate, useAppContext, usePagination } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WardPatient, WardViewContext } from '../types';
import { bedLayoutToBed, getOpenmrsId } from '../ward-view/ward-view.resource';
import { EmptyState } from './table-state-components';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import { Pagination } from '@carbon/react';
const AdmittedPatients = () => {
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { bedLayouts, wardAdmittedPatientsWithBed, isLoading } = wardPatientGroupDetails ?? {};
  const { t } = useTranslation();

  const headers = [
    { key: 'admissionDate', header: t('admissionDate', 'Admission Date') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('durationOnWard', 'Days In Ward') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const patients = useMemo(() => {
    const DOCTORE_VISIT_ENCOUNTER_TYPE = '14b36860-5033-4765-b91b-ace856ab64c2';
    return (
      bedLayouts
        ?.map((bedLayout) => {
          const { patients } = bedLayout;
          const bed = bedLayoutToBed(bedLayout);
          const wardPatients: WardPatient[] = patients.map((patient): WardPatient => {
            const inpatientAdmission = wardAdmittedPatientsWithBed?.get(patient.uuid);
            if (inpatientAdmission) {
              const { patient, visit, currentInpatientRequest } = inpatientAdmission;
              return { patient, visit, bed, inpatientAdmission, inpatientRequest: currentInpatientRequest || null };
            } else {
              // for some reason this patient is in a bed but not in the list of admitted patients, so we need to use the patient data from the bed endpoint
              return {
                patient: patient,
                visit: null,
                bed,
                inpatientAdmission: null, // populate after BED-13
                inpatientRequest: null,
              };
            }
          });
          return wardPatients;
        })
        ?.flat() ?? []
    ).filter((pat) => {
      const noteEncounter = pat?.visit?.encounters?.find(
        (encounter) => encounter.encounterType?.uuid === DOCTORE_VISIT_ENCOUNTER_TYPE,
      );
      if (!noteEncounter) return true;
      return true;
    });
  }, [bedLayouts, wardAdmittedPatientsWithBed]);

  const [pageSize, setPageSize] = useState(5);
  const { paginated, results, totalPages, currentPage, goTo } = usePagination(patients, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, totalPages, currentPage, results.length);
  const tableRows = useMemo(() => {
    return results.map((patient, index) => {
      const { encounterAssigningToCurrentInpatientLocation } = patient.inpatientAdmission ?? {};

      const admissionDate = encounterAssigningToCurrentInpatientLocation?.encounterDatetime
        ? formatDatetime(parseDate(encounterAssigningToCurrentInpatientLocation!.encounterDatetime!))
        : '--';
      const daysAdmitted = encounterAssigningToCurrentInpatientLocation?.encounterDatetime
        ? dayjs(encounterAssigningToCurrentInpatientLocation?.encounterDatetime).diff(dayjs(), 'days')
        : '--';
      return {
        id: patient.patient?.uuid ?? index,
        admissionDate,
        idNumber: getOpenmrsId(patient.patient?.identifiers ?? []) ?? '--',
        name: patient.patient?.person?.display ?? '--',
        gender: patient.patient?.person?.gender ?? '--',
        age: patient.patient?.person?.age ?? '--',
        bedNumber: patient.bed?.bedNumber ?? '--',
        daysAdmitted,
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem
              itemText={t('tranfer', 'Tranfer')}
              onClick={() =>
                launchWorkspace('patient-transfer-swap-workspace', {
                  workspaceTitle: 'Trasfer',
                  wardPatient: patient,
                  withContentSwitcher: false,
                  defaultTransfersection: 'transfer',
                })
              }
            />
            <OverflowMenuItem
              itemText={t('bedSwap', 'Bed Swap')}
              onClick={() =>
                launchWorkspace('patient-transfer-swap-workspace', {
                  workspaceTitle: 'Bed Swap',
                  wardPatient: patient,
                  withContentSwitcher: false,
                  defaultTransfersection: 'bed-swap',
                })
              }
            />
            <OverflowMenuItem
              itemText={t('dischargeIn', 'Discharge In')}
              onClick={() => {
                const DOCTORS_NOTE_FORM_UUID = '87379b0a-738b-4799-9736-cdac614cee2a';

                launchWorkspace('patient-discharge-workspace', {
                  wardPatient: patient,
                  patientUuid: patient.patient.uuid,
                  formUuid: DOCTORS_NOTE_FORM_UUID,
                  workspaceTitle: t('doctorsNote', 'Doctors Note'),
                  dischargePatientOnSuccesfullSubmission: false,
                });
              }}
            />
            <OverflowMenuItem
              itemText={t('discharge', 'Discharge')}
              onClick={() => {
                const IN_PATIENT_DISCHARGE_FORM_UUID = '98a781d2-b777-4756-b4c9-c9b0deb3483c';
                launchWorkspace('patient-discharge-workspace', {
                  wardPatient: patient,
                  patientUuid: patient.patient.uuid,
                  formUuid: IN_PATIENT_DISCHARGE_FORM_UUID,
                });
              }}
            />
          </OverflowMenu>
        ),
      };
    });
  }, [results]);

  if (isLoading) return <DataTableSkeleton />;
  if (!patients.length)
    return <EmptyState message={t('noAdmittedPatientsinCurrentward', 'No admitted patients in the current ward')} />;

  return (
    <DataTable rows={tableRows} headers={headers} isSortable useZebraStyles>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getCellProps }) => (
        <TableContainer>
          <Table {...getTableProps()} aria-label="sample table">
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader
                    key={header.key}
                    {...getHeaderProps({
                      header,
                    })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                return (
                  <TableRow key={row.id} {...getRowProps({ row })}>
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id} {...getCellProps({ cell })}>
                        {cell.value}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {paginated && !isLoading && (
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              pageSizes={pageSizes}
              totalItems={(patients ?? []).length}
              onChange={({ page, pageSize }) => {
                goTo(page);
                setPageSize(pageSize);
              }}
            />
          )}
        </TableContainer>
      )}
    </DataTable>
  );
};

export default AdmittedPatients;
