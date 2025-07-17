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
  Pagination,
} from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from './table-state-components';
import { useIpdDischargeEncounter } from '../hooks/useIpdDischargeEncounter';
import { formatDatetime, parseDate } from '@openmrs/esm-framework';
import {
  HyperLinkPatientCell,
  PatientAdmissionDateCell,
  PatientAgeCell,
  PatientDayInWardCell,
  PatientGenderCell,
} from './patient-cells';

const DischargePatients = () => {
  const { t } = useTranslation();
  const {
    encounters,
    error,
    isLoading,
    paginated,
    currentPage,
    pageSizes,
    goTo,
    currPageSize,
    setCurrPageSize,
    totalCount,
  } = useIpdDischargeEncounter();
  const headers = [
    { key: 'admissionDate', header: t('admissionDate', 'Admission Date') },
    { key: 'dischargeDate', header: t('dischargeDate', 'Discharge Date') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('durationOnWard', 'Duration on Ward') },
    { key: 'action', header: t('action', 'Action') },
  ];
  const tableRows = useMemo(() => {
    return encounters.map((encounter, index) => {
      return {
        id: encounter.uuid,
        dischargeDate: encounter.encounterDateTime ? formatDatetime(parseDate(encounter.encounterDateTime)) : '--',
        admissionDate: <PatientAdmissionDateCell patientUuid={encounter.patient.uuid} encounterUuid={encounter.uuid} />,
        idNumber: encounter.patient.openmrsId,
        name: <HyperLinkPatientCell patientName={encounter.patient.name} patientUuid={encounter.patient.uuid} />, //encounter.patient.name,
        gender: <PatientGenderCell patientUuid={encounter.patient.uuid} />,
        age: <PatientAgeCell patientUuid={encounter.patient.uuid} />,
        bedNumber: '--',
        daysAdmitted: <PatientDayInWardCell patientUuid={encounter.patient.uuid} encounterUuid={encounter.uuid} />,
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem itemText={t('dischargeSummary', 'Discharge Summary')} onClick={() => {}} />
            <OverflowMenuItem itemText={t('gatePass', 'Gate Pass')} onClick={() => {}} />
          </OverflowMenu>
        ),
      };
    });
  }, [encounters, t]);

  if (isLoading) return <DataTableSkeleton />;
  if (error) return <ErrorState error={error} />;

  if (!encounters?.length) return <EmptyState message={t('noDischargedPatients', 'No Discharged patients')} />;

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
              forwardText=""
              backwardText=""
              page={currentPage}
              pageSize={currPageSize}
              pageSizes={pageSizes}
              totalItems={totalCount}
              size={'sm'}
              onChange={({ page: newPage, pageSize }) => {
                if (newPage !== currentPage) {
                  goTo(newPage);
                }
                setCurrPageSize(pageSize);
              }}
            />
          )}
        </TableContainer>
      )}
    </DataTable>
  );
};

export default DischargePatients;
