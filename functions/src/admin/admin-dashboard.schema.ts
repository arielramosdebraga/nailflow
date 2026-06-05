/* eslint-disable require-jsdoc */
import {HttpsError} from "firebase-functions/v2/https";

export interface GetGlobalDashboardInput {
  includeInactiveSalons: boolean;
}

export interface GlobalDashboardSummary {
  totalSalons: number;
  activeSalons: number;
  totalUsers: number;
  superAdmins: number;
  salonOwners: number;
  nailTechnicians: number;
  totalClients: number;
  totalAppointments: number;
}

export interface GetGlobalDashboardResponse {
  summary: GlobalDashboardSummary;
  generatedAt: string;
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ?
    (value as Record<string, unknown>) :
    {};
}

function readBooleanWithDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function parseGetGlobalDashboardInput(
  payload: unknown
): GetGlobalDashboardInput {
  const data = getRecord(payload);

  if (
    data.includeInactiveSalons !== undefined &&
    typeof data.includeInactiveSalons !== "boolean"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "includeInactiveSalons deve ser boolean quando informado."
    );
  }

  return {
    includeInactiveSalons: readBooleanWithDefault(
      data.includeInactiveSalons,
      true
    ),
  };
}
