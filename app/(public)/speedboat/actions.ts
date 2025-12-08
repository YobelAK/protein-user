'use server';

import { speedboatService } from '@/services/speedboatService';
import type { SchedulesActionResult, SerializedSpeedboatSchedule } from '@/lib/types/speedboat';
import { SpeedboatSchedule } from '@/lib/generated/prisma';

function serializeSchedule(schedule: any): SerializedSpeedboatSchedule {
  return {
    id: schedule.id,
    speedboat: {
      id: schedule.speedboat.id,
      name: schedule.speedboat.name,
      operator: {
        id: schedule.speedboat.operator.id,
        name: schedule.speedboat.operator.name,
        logo: schedule.speedboat.operator.logo,
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

export async function getSpeedboatSchedulesAction(params: {
  page?: number;
  pageSize?: number;
  origin?: string;
  destination?: string;
  departureDate?: string;
}): Promise<SchedulesActionResult> {
  try {
    const result = await speedboatService.getAvailableSchedules({
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
    console.error('Error fetching speedboat schedules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve schedules.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getRoutesAction() {
  try {
    const routes = await speedboatService.getRoutes();
    return { success: true, routes };
  } catch (error: unknown) {
    console.error('Error fetching routes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve routes.';
    return { success: false, error: errorMessage };
  }
}

export async function getOperatorsAction() {
  try {
    const operators = await speedboatService.getOperators();
    return { success: true, operators };
  } catch (error: unknown) {
    console.error('Error fetching operators:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve operators.';
    return { success: false, error: errorMessage };
  }
}
