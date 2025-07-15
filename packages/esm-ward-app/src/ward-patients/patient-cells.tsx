import { InlineLoading } from '@carbon/react';
import { formatDatetime, parseDate, useConfig, usePatient } from '@openmrs/esm-framework';
import dayjs from 'dayjs';
import React, { FC, useMemo } from 'react';
import { useEncounterDetails } from '../hooks/useIpdDischargeEncounter';
import { WardConfigObject } from '../config-schema';

type CellProps = {
  patientUuid: string;
};

export const PatientAgeCell: FC<CellProps> = ({ patientUuid }) => {
  const { isLoading, patient, error } = usePatient(patientUuid);
  const age = useMemo(() => {
    if (!patient?.birthDate) return '--';
    return dayjs().diff(dayjs(patient.birthDate), 'years');
  }, [patient?.birthDate]);
  if (isLoading) return <InlineLoading />;
  if (error) return <p>--</p>;
  return <div>{age}</div>;
};

export const PatientGenderCell: FC<CellProps> = ({ patientUuid }) => {
  const { isLoading, patient, error } = usePatient(patientUuid);

  if (isLoading) return <InlineLoading />;
  if (error) return <p>--</p>;
  return <div>{patient.gender}</div>;
};

type PatientAdmissionCellProps = CellProps & {
  encounterUuid: string;
};

export const PatientAdmissionDateCell: FC<PatientAdmissionCellProps> = ({ encounterUuid }) => {
  const { encounter, error, isLoading } = useEncounterDetails(encounterUuid);
  const { admissionEncounterTypeUuid } = useConfig<WardConfigObject>();

  const admissionDate = useMemo(() => {
    const admisionEncounter = encounter?.visit?.encounters?.find(
      (e) => e.encounterType.uuid === admissionEncounterTypeUuid,
    );
    if (!admisionEncounter || !admisionEncounter.encounterDatetime) return '--';
    return formatDatetime(parseDate(admisionEncounter.encounterDatetime));
  }, [encounter, admissionEncounterTypeUuid]);
  if (isLoading) return <InlineLoading />;
  if (error) return <p>--</p>;

  return <p>{admissionDate}</p>;
};

export const PatientDayInWardCell: FC<PatientAdmissionCellProps> = ({ encounterUuid }) => {
  const { encounter, error, isLoading } = useEncounterDetails(encounterUuid);
  const { admissionEncounterTypeUuid } = useConfig<WardConfigObject>();
  const daysInWard = useMemo(() => {
    const admisionEncounter = encounter?.visit?.encounters?.find(
      (e) => e.encounterType.uuid === admissionEncounterTypeUuid,
    );
    if (!admisionEncounter || !admisionEncounter.encounterDatetime) return '--';
    const dischargeEncounter = encounter?.visit?.encounters?.find((e) => e.uuid === encounterUuid);
    if (!dischargeEncounter || !dischargeEncounter.encounterDatetime) return '--';

    const admissionDate = dayjs(admisionEncounter.encounterDatetime).startOf('day');
    const dischargeDate = dischargeEncounter.encounterDatetime
      ? dayjs(dischargeEncounter.encounterDatetime).startOf('day')
      : dayjs().startOf('day');
    const daysAdmitted =
      admissionDate.isValid() && dischargeDate.isValid() ? Math.abs(dischargeDate.diff(admissionDate, 'days')) : '--';
    return daysAdmitted;
  }, [encounter, encounterUuid, admissionEncounterTypeUuid]);
  if (isLoading) return <InlineLoading />;
  if (error) return <p>--</p>;

  return <p>{daysInWard}</p>;
};
