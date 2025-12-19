'use server';

import { fastboatService } from '@/services/fastboatService';
import type { SchedulesActionResult, SerializedfastboatSchedule } from '@/lib/types/fastboat';
import { fastboatSchedule } from '@/lib/generated/prisma';

function serializeSchedule(schedule: any): SerializedfastboatSchedule {
  return {
    id: schedule.id,
    fastboat: {
      id: schedule.fastboat.id,
      name: schedule.fastboat.name,
      operator: {
        id: schedule.fastboat.operator.id,
        name: schedule.fastboat.operator.name,
        logo: schedule.fastboat.operator.logo,
      },
    },
    route: {
      id: schedule.route.id,
      name: schedule.route.name,
      origin: schedule.route.origin,
      destination: schedule.route.destination,
    },
    departureTime: schedule.departureTime,
    arrivalTime: schedule.arrivalTime,
    duration: schedule.duration,
    priceAdultIndonesian: schedule.priceAdultIndonesian.toString(),
    priceChildIndonesian: schedule.priceChildIndonesian.toString(),
    priceAdultForeigner: schedule.priceAdultForeigner.toString(),
    priceChildForeigner: schedule.priceChildForeigner.toString(),
    availableSeats: schedule.availableSeats,
    isActive: schedule.isActive,
  };
}

export async function getfastboatSchedulesAction(params: {
  page?: number;
  pageSize?: number;
  origin?: string;
  destination?: string;
  departureDate?: string;
}): Promise<SchedulesActionResult> {
  try {
    const result = await fastboatService.getAvailableSchedules({
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
    });

    const serializedSchedules = result.schedules.map(serializeSchedule);

    return {
      success: true,
      schedules: serializedSchedules,
      totalRecords: result.totalRecords,
    };
  } catch (error: unknown) {
    console.error('Error fetching fastboat schedules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve schedules.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getRoutesAction() {
  try {
    const routes = await fastboatService.getRoutes();
    return { success: true, routes };
  } catch (error: unknown) {
    console.error('Error fetching routes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve routes.';
    return { success: false, error: errorMessage };
  }
}

export async function getOperatorsAction() {
  try {
    const operators = await fastboatService.getOperators();
    return { success: true, operators };
  } catch (error: unknown) {
    console.error('Error fetching operators:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve operators.';
    return { success: false, error: errorMessage };
  }
}
