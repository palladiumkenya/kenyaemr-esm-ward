import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@carbon/react';
import { useAppContext } from '@openmrs/esm-framework';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WardPatient, WardViewContext } from '../../types';
import { bedLayoutToBed, getOpenmrsId } from '../ward-view.resource';
import { Layer } from '@carbon/react';
import { DataTableSkeleton } from '@carbon/react';
import styles from '../linelist-wards/linelist-wards.scss';
import {
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

const WardOccupancyTable = () => {
  const { t } = useTranslation();

  return (
    <Tabs onTabCloseRequest={() => {}}>
      <TabList scrollDebounceWait={200}>
        <Tab>{t('awaitingAdmision', 'Awaiting Admission')}</Tab>
        <Tab>{t('admitted', 'Admitted')}</Tab>
        <Tab>{t('dischargeIn', 'Discharge In')}</Tab>
        <Tab>{t('discharge', 'Discharge')}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <DatatableReusable />
        </TabPanel>
        <TabPanel>
          <DatatableReusable />
        </TabPanel>
        <TabPanel>
          <DatatableReusable />
        </TabPanel>
        <TabPanel>
          <DatatableReusable />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default WardOccupancyTable;

type Props = {};

const DatatableReusable: FC<Props> = () => {
  const { t } = useTranslation();
  const headers = [
    { key: 'admissiondate', header: t('admissionDate', 'Admission Date') },
    { key: 'idNumber', header: t('idNumber', 'ID Number') },
    { key: 'name', header: t('name', 'Name') },
    { key: 'gender', header: t('gender', 'Gender') },
    { key: 'age', header: t('age', 'Age') },
    { key: 'bedNumber', header: t('bedNumber', 'Bed Number') },
    { key: 'daysAdmitted', header: t('daysAdmitted', 'Days admitted') },
    { key: 'action', header: t('action', 'Action') },
  ];

  const { wardPatientGroupDetails } = useAppContext<WardViewContext>('ward-view-context') ?? {};
  const { bedLayouts, wardAdmittedPatientsWithBed, isLoading } = wardPatientGroupDetails ?? {};

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
    );
  }, [bedLayouts, wardAdmittedPatientsWithBed]);

  const tableRows = useMemo(() => {
    return patients.map((patient, index) => {
      return {
        id: patient.patient?.uuid ?? index,
        admissiondate: '--',
        idNumber: getOpenmrsId(patient.patient?.identifiers ?? []) ?? '--',
        name: patient.patient?.person?.display ?? '--',
        gender: patient.patient?.person?.gender ?? '--',
        age: patient.patient?.person?.age ?? '--',
        bedNumber: patient.bed?.bedNumber ?? '--',
        daysAdmitted: '--',
        action: '--',
      };
    });
  }, [patients]);

  console.log(patients);

  if (isLoading)
    return (
      <Layer className={styles.tableContainer}>
        <DataTableSkeleton />
      </Layer>
    );

  return (
    <DataTable rows={tableRows} headers={headers} isSortable useZebraStyles>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getCellProps }) => (
        <TableContainer className={styles.claimsTable}>
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
