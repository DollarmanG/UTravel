-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending_payment', 'confirmed', 'expired', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingReference" TEXT NOT NULL,
    "sessionId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntent" TEXT,
    "stripePaymentStatus" TEXT,
    "customerEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending_payment',
    "currency" TEXT NOT NULL DEFAULT 'sek',
    "amount" INTEGER NOT NULL,
    "originalCurrency" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "passengerCount" INTEGER NOT NULL,
    "flightAmountPerPersonSekMinor" INTEGER NOT NULL,
    "serviceFeePerPersonSekMinor" INTEGER NOT NULL,
    "seatPriceSekMinor" INTEGER NOT NULL DEFAULT 0,
    "bagPriceSekMinor" INTEGER NOT NULL DEFAULT 0,
    "flightTotalSekMinor" INTEGER NOT NULL,
    "serviceFeeTotalSekMinor" INTEGER NOT NULL,
    "seatTotalSekMinor" INTEGER NOT NULL DEFAULT 0,
    "baggageTotalSekMinor" INTEGER NOT NULL DEFAULT 0,
    "totalSekMinor" INTEGER NOT NULL,
    "eurToSekRate" DOUBLE PRECISION NOT NULL,
    "seatSelection" BOOLEAN NOT NULL DEFAULT false,
    "checkedBags" INTEGER NOT NULL DEFAULT 0,
    "offerSnapshot" JSONB NOT NULL,
    "duffelOrderId" TEXT,
    "duffelOrder" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'adult',
    "title" TEXT,
    "gender" TEXT,
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "bornOn" TEXT NOT NULL,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingReference_key" ON "Booking"("bookingReference");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_sessionId_key" ON "Booking"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_stripeCheckoutSessionId_key" ON "Booking"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Booking_customerEmail_idx" ON "Booking"("customerEmail");

-- CreateIndex
CREATE INDEX "Booking_bookingReference_idx" ON "Booking"("bookingReference");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Passenger_bookingId_idx" ON "Passenger"("bookingId");

-- CreateIndex
CREATE INDEX "Passenger_familyName_idx" ON "Passenger"("familyName");

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
