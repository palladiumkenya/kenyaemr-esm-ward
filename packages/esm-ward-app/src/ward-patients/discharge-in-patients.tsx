import {
  OverflowMenu,
  OverflowMenuItem,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
} from '@carbon/react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './table-state-components';
import {
  formatDatetime,
  launchWorkspace,
  type OpenmrsResource,
  parseDate,
  useAppContext,
  useConfig,
  usePagination,
} from '@openmrs/esm-framework';
import { type WardPatient, type WardViewContext } from '../types';
import { bedLayoutToBed, getOpenmrsId } from '../ward-view/ward-view.resource';
import dayjs from 'dayjs';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import { type WardConfigObject } from '../config-schema';
import { HyperLinkPatientCell } from './patient-cells';

const DischargeInPatients = () => {
  const { t } = useTranslation();
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { bedLayouts, wardAdmittedPatientsWithBed, isLoading } = wardPatientGroupDetails ?? {};
  const config = useConfig<WardConfigObject>();
  const headers = [
    { key: 'admissionDate', header: t('admissionDate', 'Admission Date') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('durationOnWard', 'Duration on Ward') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const patients = useMemo(() => {
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
        (encounter) => encounter.encounterType?.uuid === config.doctorsnoteEncounterTypeUuid,
      );
      if (!noteEncounter) return false;
      const obs = noteEncounter.obs.find((ob) => ob.concept.uuid === config.referralsConceptUuid);
      if (!obs) return false;
      const isDischargedIn = [config.referringToAnotherFacilityConceptUuid, config.dischargeHomeConceptUuid].includes(
        (obs.value as OpenmrsResource).uuid,
      );
      return isDischargedIn === true;
    });
  }, [bedLayouts, wardAdmittedPatientsWithBed, config]);

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
        name: (
          <HyperLinkPatientCell patientName={patient.patient?.person?.display} patientUuid={patient.patient?.uuid} />
        ),
        gender: patient.patient?.person?.gender ?? '--',
        age: patient.patient?.person?.age ?? '--',
        bedNumber: patient.bed?.bedNumber ?? '--',
        daysAdmitted,
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem itemText={t('goToBilling', 'Go to Billing')} onClick={() => {}} />
            <OverflowMenuItem itemText={t('waivePatient', 'Waive Patient')} onClick={() => {}} />
            <OverflowMenuItem itemText={t('patientAbscondend', 'Patient Absconded')} onClick={() => {}} />
            <OverflowMenuItem
              itemText={t('discharge', 'Discharge')}
              onClick={() => {
                launchWorkspace('patient-discharge-workspace', {
                  wardPatient: patient,
                  patientUuid: patient.patient.uuid,
                  formUuid: config.inpatientDischargeFormUuid,
                });
              }}
            />
          </OverflowMenu>
        ),
      };
    });
  }, [results, config, t]);

  if (!patients.length) return <EmptyState message={t('noDischargeInpatients', 'No Discharge in patients')} />;

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

export default DischargeInPatients;
