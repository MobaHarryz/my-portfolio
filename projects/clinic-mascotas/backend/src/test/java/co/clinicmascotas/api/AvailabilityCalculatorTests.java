package co.clinicmascotas.api;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import co.clinicmascotas.api.appointment.AvailabilityCalculator;
import co.clinicmascotas.api.appointment.AvailabilityCalculator.DaySlots;

class AvailabilityCalculatorTests {

    // 2026-09-14 is a Monday
    private static final LocalDate MONDAY = LocalDate.of(2026, 9, 14);

    private static final Map<DayOfWeek, List<String>> SCHEDULE = Map.of(
            DayOfWeek.MONDAY, List.of("15:00", "11:00", "13:00"),
            DayOfWeek.WEDNESDAY, List.of("10:00"));

    @Test
    void returnsSortedTimesOnlyForScheduledDays() {
        List<DaySlots> slots = AvailabilityCalculator.freeSlots(SCHEDULE, MONDAY, 7,
                MONDAY.minusDays(1).atStartOfDay(), Set.of());

        assertThat(slots).containsExactly(
                new DaySlots(MONDAY, List.of("11:00", "13:00", "15:00")),
                new DaySlots(MONDAY.plusDays(2), List.of("10:00")));
    }

    @Test
    void hidesPastAndTakenSlots() {
        LocalDateTime now = MONDAY.atTime(12, 0);
        Set<LocalDateTime> taken = Set.of(MONDAY.atTime(15, 0));

        List<DaySlots> slots = AvailabilityCalculator.freeSlots(SCHEDULE, MONDAY, 1, now, taken);

        assertThat(slots).containsExactly(new DaySlots(MONDAY, List.of("13:00")));
    }

    @Test
    void omitsDaysWithoutFreeSlots() {
        Set<LocalDateTime> taken = Set.of(MONDAY.plusDays(2).atTime(10, 0));

        List<DaySlots> slots = AvailabilityCalculator.freeSlots(SCHEDULE, MONDAY.plusDays(1), 2,
                MONDAY.atStartOfDay(), taken);

        assertThat(slots).isEmpty();
    }

    @Test
    void returnsNothingWhenVetHasNoScheduleOrIsFullyBooked() {
        assertThat(AvailabilityCalculator.freeSlots(Map.of(), MONDAY, 21, MONDAY.atStartOfDay(), Set.of())).isEmpty();

        Set<LocalDateTime> everyMondaySlotTaken = Set.of(MONDAY.atTime(11, 0), MONDAY.atTime(13, 0), MONDAY.atTime(15, 0));
        assertThat(AvailabilityCalculator.freeSlots(Map.of(DayOfWeek.MONDAY, List.of("11:00", "13:00", "15:00")),
                MONDAY, 1, MONDAY.atStartOfDay(), everyMondaySlotTaken)).isEmpty();
    }

    @Test
    void recognisesScheduledStartTimes() {
        assertThat(AvailabilityCalculator.isScheduled(SCHEDULE, MONDAY.atTime(13, 0))).isTrue();
        assertThat(AvailabilityCalculator.isScheduled(SCHEDULE, MONDAY.atTime(13, 30))).isFalse();
        assertThat(AvailabilityCalculator.isScheduled(SCHEDULE, MONDAY.plusDays(1).atTime(13, 0))).isFalse();
    }
}
