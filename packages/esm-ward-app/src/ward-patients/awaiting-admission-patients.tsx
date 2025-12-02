import {
  DataTable,
  DataTableSkeleton,
  OverflowMenu,
  OverflowMenuItem,
  Pagination,
  Search,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { formatDatetime, launchWorkspace, parseDate, useAppContext, usePagination } from '@openmrs/esm-framework';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type WardPatient, type WardPatientWorkspaceProps, type WardViewContext } from '../types';
import { getOpenmrsId } from '../ward-view/ward-view.resource';
import AdmitPatientButton from '../ward-workspace/admit-patient-button.component';
import { HyperLinkPatientCell } from './patient-cells';
import { EmptyState, ErrorState } from './table-state-components';

const AwaitingAdmissionPatients = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { inpatientRequests, isLoading, error } = wardPatientGroupDetails?.inpatientRequestResponse ?? {};
  const [pageSize, setPageSize] = useState(5);
  const searchResults = useMemo(() => {
    return inpatientRequests?.filter((req) =>
      req.patient?.person?.display.toLowerCase().includes(search.toLowerCase()),
    );
  }, [inpatientRequests, search]);
  const { paginated, results, totalPages, currentPage, goTo } = usePagination(searchResults, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, totalPages, currentPage, results.length);

  const headers = [
    { key: 'admissionDate', header: t('dateQueued', 'Date Queued') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('durationOnWard', 'Days In Queue') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const launchPatientTransferForm = (wardPatient: WardPatient) => {
    launchWorkspace<WardPatientWorkspaceProps>('patient-transfer-request-workspace', {
      wardPatient,
    });
  };

  const launchCancelAdmissionForm = (wardPatient: WardPatient) => {
    launchWorkspace<WardPatientWorkspaceProps>('cancel-admission-request-workspace', {
      wardPatient,
    });
  };
  const tableRows = useMemo(() => {
    return results?.map((request, index) => {
      const admissionDate = request.dispositionEncounter?.encounterDatetime
        ? formatDatetime(parseDate(request.dispositionEncounter?.encounterDatetime))
        : '--';
      const encounterDate = request.dispositionEncounter?.encounterDatetime;
      const daysAdmitted =
        encounterDate && dayjs(encounterDate).isValid()
          ? Math.abs(dayjs().startOf('day').diff(dayjs(encounterDate).startOf('day'), 'days'))
          : '--';
      const wardPatient = {
        patient: request.patient,
        visit: request.visit,
        bed: null,
        inpatientRequest: request,
        inpatientAdmission: null,
      };
      const isTransfer = wardPatient.inpatientRequest.dispositionType == 'TRANSFER';

      return {
        id: request?.patient?.uuid ?? index,
        admissionDate,
        idNumber: getOpenmrsId(request.patient?.identifiers ?? []) ?? '--',
        name: (
          <HyperLinkPatientCell patientName={request.patient?.person?.display} patientUuid={request.patient?.uuid} />
        ),
        gender: request?.patient?.person?.gender ?? '--',
        age: request?.patient?.person?.age ?? '--',
        bedNumber: '--',
        daysAdmitted,
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem
              itemText={
                isTransfer ? t('transferElsewhere', 'Transfer elsewhere') : t('admitElsewhere', 'Admit elsewhere')
              }
              onClick={() => launchPatientTransferForm(wardPatient)}
            />
            <AdmitPatientButton
              wardPatient={wardPatient}
              dispositionType={wardPatient.inpatientRequest.dispositionType}
              onAdmitPatientSuccess={() => {}}
              component="menu"
            />
            <OverflowMenuItem itemText={t('cancel', 'Cancel')} onClick={() => launchCancelAdmissionForm(wardPatient)} />
          </OverflowMenu>
        ),
      };
    });
  }, [results, t]);

  if (isLoading) return <DataTableSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!inpatientRequests || !inpatientRequests.length)
    return <EmptyState message={t('noPatientInAdmisionQueue', 'No patients in admission queue')} />;
  return (
    <div>
      <Search value={search} onChange={(e) => setSearch(e.target.value)} />
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
                totalItems={(inpatientRequests ?? []).length}
                onChange={({ page, pageSize }) => {
                  goTo(page);
                  setPageSize(pageSize);
                }}
              />
            )}
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
};

export default AwaitingAdmissionPatients;
