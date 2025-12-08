'use server';

import { bookingService } from '@/services/bookingService';
import { createBookingSchema } from '@/lib/validations/bookingSchema';
import type { BookingActionResult, SerializedBooking } from '@/lib/types/booking';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

function serializeBooking(booking: any): SerializedBooking {
  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    schedule: {
      id: booking.schedule.id,
      departureTime: booking.schedule.departureTime,
      arrivalTime: booking.schedule.arrivalTime,
      duration: booking.schedule.duration,
      route: {
        origin: booking.schedule.route.origin,
        destination: booking.schedule.route.destination,
      },
      speedboat: {
        name: booking.schedule.speedboat.name,
        operator: {
          name: booking.schedule.speedboat.operator.name,
        },
      },
    },
    contactName: booking.contactName,
    contactEmail: booking.contactEmail,
    contactPhone: booking.contactPhone,
    departureDate: booking.departureDate.toISOString(),
    returnDate: booking.returnDate ? booking.returnDate.toISOString() : null,
    isRoundTrip: booking.isRoundTrip,
    subtotal: booking.subtotal.toString(),
    portFee: booking.portFee.toString(),
    addonsTotal: booking.addonsTotal.toString(),
    totalAmount: booking.totalAmount.toString(),
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    paidAt: booking.paidAt ? booking.paidAt.toISOString() : null,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    passengers: booking.passengers.map((p: any) => ({
      id: p.id,
      title: p.title,
      firstName: p.firstName,
      lastName: p.lastName,
      nationality: p.nationality,
      identityType: p.identityType,
      identityNumber: p.identityNumber,
      passengerType: p.passengerType,
      nationalityType: p.nationalityType,
    })),
    addons: booking.addons.map((a: any) => ({
      id: a.id,
      quantity: a.quantity,
      price: a.price.toString(),
      addon: {
        name: a.addon.name,
        description: a.addon.description,
      },
    })),
  };
}

export async function createBookingAction(data: z.infer<typeof createBookingSchema>): Promise<BookingActionResult> {
  try {
    const validatedData = createBookingSchema.parse(data);
    
    const booking = await bookingService.createBooking(validatedData as any);
    
    revalidatePath('/speedboat/book');
    
    return {
      success: true,
      booking: serializeBooking(booking),
    };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      return {
        success: false,
        error: 'Validation Error',
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getBookingByNumberAction(bookingNumber: string): Promise<BookingActionResult> {
  try {
    const booking = await bookingService.getBookingByNumber(bookingNumber);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }
    
    return {
      success: true,
      booking: serializeBooking(booking),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve booking';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function updatePaymentStatusAction(
  bookingId: string,
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED'
): Promise<BookingActionResult> {
  try {
    const booking = await bookingService.updatePaymentStatus(
      bookingId,
      paymentStatus as any,
      paymentStatus === 'PAID' ? new Date() : undefined
    );
    
    revalidatePath('/speedboat/book');
    
    return {
      success: true,
      booking: serializeBooking(booking),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update payment status';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
