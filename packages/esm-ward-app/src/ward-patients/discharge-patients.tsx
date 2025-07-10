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
} from '@carbon/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './table-state-components';
import { useAppContext } from '@openmrs/esm-framework';
import { WardViewContext } from '../types';

const DischargePatients = () => {
  const { t } = useTranslation();
  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};

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
  const patients = [];
  const tableRows = useMemo(() => {
    return patients.map((patient, index) => {
      return {
        id: '--',
        admissionDate: '--',
        idNumber: '--',
        name: '--',
        gender: '--',
        age: '--',
        bedNumber: '--',
        daysAdmitted: '--',
        action: (
          <OverflowMenu size={'sm'} flipped>
            <OverflowMenuItem
              itemText={t('queueToAnother', 'Queue to another')}
              //   onClick={() => handleClaimAction(row.id, 'retry')}
            />
            <OverflowMenuItem
              itemText={t('admitPatient', 'Admit Patient')}
              //   onClick={() => handleClaimAction(row.id, 'update')}
            />
            <OverflowMenuItem
              itemText={t('cancel', 'Cancel')}
              //   onClick={() => handleClaimAction(row.id, 'update')}
            />
          </OverflowMenu>
        ),
      };
    });
  }, [patients]);

  if (!patients.length) return <EmptyState message={t('noDischargepatients', 'No Discharge patients')} />;

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
          {/* {paginated && !isLoading && (
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
              )} */}
        </TableContainer>
      )}
    </DataTable>
  );
};

export default DischargePatients;
